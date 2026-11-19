import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient as createSupabase } from "@supabase/supabase-js";

/**
 * Razorpay, server side only. Nothing here may be imported by a client component.
 *
 * Trust model: the browser is never believed. A payment counts only after this server has
 *  1. checked Razorpay's signature (for the browser callback) or the webhook signature, and
 *  2. asked Razorpay itself for the payment and seen that it is captured for the right order.
 * Only then does it call the database function that marks the order paid, using a secret that
 * lives in this server's environment and in Supabase Vault.
 */

const API = "https://api.razorpay.com/v1";

export function razorpayKeys(): { id: string; secret: string } | null {
  const id = process.env.RAZORPAY_KEY_ID?.trim();
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  return id && secret ? { id, secret } : null;
}

export function webhookSecret(): string | null {
  return process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || null;
}

export class RazorpayError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const keys = razorpayKeys();
  if (!keys) throw new RazorpayError("Razorpay is not configured", 503);
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keys.id}:${keys.secret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { error?: { description?: string } } & T;
  if (!res.ok) throw new RazorpayError(json.error?.description ?? `Razorpay error ${res.status}`, res.status);
  return json;
}

export type RazorpayPayment = {
  id: string;
  order_id: string | null;
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  method?: string;
};

export const createRazorpayOrder = (args: {
  amountPaise: number;
  currency: string;
  receipt: string;
  notes: Record<string, string>;
}) =>
  call<{ id: string; amount: number; currency: string }>("POST", "/orders", {
    amount: args.amountPaise,
    currency: args.currency,
    receipt: args.receipt,
    notes: args.notes,
  });

export const fetchPayment = (id: string) => call<RazorpayPayment>("GET", `/payments/${encodeURIComponent(id)}`);

export const capturePayment = (id: string, amount: number, currency: string) =>
  call<RazorpayPayment>("POST", `/payments/${encodeURIComponent(id)}/capture`, { amount, currency });

/** Equal-length, constant-time comparison of two hex strings. */
export function safeEqualHex(a: string, b: string): boolean {
  const x = Buffer.from(a, "utf8");
  const y = Buffer.from(b, "utf8");
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Razorpay Checkout's callback signature: HMAC-SHA256 of "order_id|payment_id" with the key secret. */
export function checkoutSignature(orderId: string, paymentId: string, keySecret: string): string {
  return createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
}

export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string, keySecret: string): boolean {
  return safeEqualHex(checkoutSignature(orderId, paymentId, keySecret), signature);
}

/** Webhook signature: HMAC-SHA256 of the raw request body with the webhook secret. */
export function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  return safeEqualHex(createHmac("sha256", secret).update(rawBody).digest("hex"), signature);
}

/* ---------- Database bridge ---------- */

function bridgeSecret(): string {
  const s = process.env.PAYMENT_BRIDGE_SECRET;
  if (!s || s.length < 32) throw new Error("PAYMENT_BRIDGE_SECRET must be set (at least 32 characters)");
  return s;
}

function db() {
  return createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Marks our order paid. The database re-checks the Razorpay order id and the amount. */
export async function confirmPaid(args: {
  orderId: string;
  razorpayOrderId: string;
  payment: RazorpayPayment;
}): Promise<{ ok: true; already: boolean } | { ok: false; error: string }> {
  const { data, error } = await db().rpc("service_confirm_payment", {
    p_secret: bridgeSecret(),
    p_order_id: args.orderId,
    p_razorpay_order_id: args.razorpayOrderId,
    p_payment_id: args.payment.id,
    p_amount_paise: args.payment.amount,
    p_method: args.payment.method ?? null,
  });
  if (error) return { ok: false, error: error.message };
  const r = data as { status: string; already?: boolean };
  return r.status === "paid" ? { ok: true, already: Boolean(r.already) } : { ok: false, error: `Order is ${r.status}` };
}

export async function markFailed(orderId: string, reason: string): Promise<void> {
  await db().rpc("service_mark_failed", { p_secret: bridgeSecret(), p_order_id: orderId, p_reason: reason });
}

export async function markRefunded(paymentId: string): Promise<void> {
  await db().rpc("service_mark_refunded", { p_secret: bridgeSecret(), p_payment_id: paymentId });
}

/**
 * Looks the payment up with Razorpay and, if it was only authorised, captures it.
 * Returns the payment only when it is captured for the expected order.
 */
export async function captureIfNeeded(paymentId: string, razorpayOrderId: string): Promise<RazorpayPayment | null> {
  let p = await fetchPayment(paymentId);
  if (p.order_id !== razorpayOrderId) return null;
  if (p.status === "authorized") p = await capturePayment(p.id, p.amount, p.currency);
  return p.status === "captured" && p.order_id === razorpayOrderId ? p : null;
}
