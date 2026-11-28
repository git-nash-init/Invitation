import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Cashfree Payments, server side only. Nothing here may be imported by a client component.
 *
 * Trust model: the browser is never believed. An order counts as paid
 * only after this server has asked Cashfree for the order and seen it PAID for the full amount.
 * The webhook does the same after checking Cashfree's signature.
 */

const API_VERSION = "2025-01-01";

export type CashfreeMode = "sandbox" | "production";

export function cashfreeKeys(): { appId: string; secret: string; mode: CashfreeMode } | null {
  const appId = process.env.CASHFREE_APP_ID?.trim();
  const secret = process.env.CASHFREE_SECRET_KEY?.trim();
  if (!appId || !secret) return null;
  return { appId, secret, mode: cashfreeMode(appId, secret, process.env.CASHFREE_ENV) };
}

/**
 * Test and live keys are different worlds. CASHFREE_ENV decides when it is set; otherwise the
 * keys themselves say which they are (test App IDs start with TEST, test secrets contain _test_).
 */
export function cashfreeMode(appId: string, secret: string, env?: string): CashfreeMode {
  const e = env?.trim().toLowerCase();
  if (e === "production" || e === "prod" || e === "live") return "production";
  if (e === "sandbox" || e === "test") return "sandbox";
  return /^TEST/i.test(appId) || /_test_/i.test(secret) ? "sandbox" : "production";
}

const base = (mode: CashfreeMode) => (mode === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg");

export class CashfreeError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const keys = cashfreeKeys();
  if (!keys) throw new CashfreeError("Cashfree is not configured", 503);
  const res = await fetch(`${base(keys.mode)}${path}`, {
    method,
    headers: {
      "x-client-id": keys.appId,
      "x-client-secret": keys.secret,
      "x-api-version": API_VERSION,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { message?: string } & T;
  if (!res.ok) throw new CashfreeError(json.message ?? `Cashfree error ${res.status}`, res.status);
  return json;
}

export type CashfreeOrder = {
  order_id: string;
  cf_order_id?: string | number;
  order_status: "ACTIVE" | "PAID" | "EXPIRED" | "TERMINATED" | "TERMINATION_REQUESTED";
  order_amount: number;
  order_currency: string;
  payment_session_id?: string;
};

export type CashfreePayment = {
  cf_payment_id: string | number;
  payment_status: "SUCCESS" | "FAILED" | "PENDING" | "NOT_ATTEMPTED" | "USER_DROPPED" | "VOID" | "CANCELLED";
  payment_amount?: number;
  payment_group?: string;
  payment_message?: string;
};

/** A 10-digit Indian mobile number, with any +91 / 0 prefix and spacing removed. Null if it is not one. */
export function cleanPhone(input: unknown): string | null {
  if (typeof input !== "string") return null;
  let d = input.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}

export const createCashfreeOrder = (args: {
  orderId: string;
  amountPaise: number;
  currency: string;
  customer: { id: string; phone: string; email?: string; name?: string };
  returnUrl: string;
  notifyUrl?: string;
  note?: string;
}) =>
  call<CashfreeOrder>("POST", "/orders", {
    order_id: args.orderId,
    order_amount: args.amountPaise / 100,
    order_currency: args.currency,
    customer_details: {
      customer_id: args.customer.id,
      customer_phone: args.customer.phone,
      ...(args.customer.email ? { customer_email: args.customer.email } : {}),
      ...(args.customer.name ? { customer_name: args.customer.name.slice(0, 100) } : {}),
    },
    order_meta: {
      return_url: args.returnUrl,
      ...(args.notifyUrl ? { notify_url: args.notifyUrl } : {}),
    },
    ...(args.note ? { order_note: args.note.slice(0, 200) } : {}),
  });

export const fetchCashfreeOrder = (orderId: string) => call<CashfreeOrder>("GET", `/orders/${encodeURIComponent(orderId)}`);

export const fetchCashfreePayments = (orderId: string) =>
  call<CashfreePayment[]>("GET", `/orders/${encodeURIComponent(orderId)}/payments`);

export type Settlement =
  | { state: "paid"; paymentId: string; amountPaise: number; method: string | null }
  | { state: "pending" }
  | { state: "not_paid"; reason: string };

/** Reads what Cashfree says about an order and its payment attempts. Pure, so it can be tested. */
export function settlementOf(order: CashfreeOrder, payments: CashfreePayment[]): Settlement {
  const list = Array.isArray(payments) ? payments : [];
  const success = list.find((p) => p.payment_status === "SUCCESS");
  if (order.order_status === "PAID" && success) {
    return {
      state: "paid",
      paymentId: String(success.cf_payment_id),
      amountPaise: Math.round(Number(order.order_amount) * 100),
      method: success.payment_group ?? null,
    };
  }
  // Paid on one side but not yet on the other: Cashfree is still writing it down.
  if (order.order_status === "PAID" || success) return { state: "pending" };
  if (list.some((p) => p.payment_status === "PENDING" || p.payment_status === "NOT_ATTEMPTED")) return { state: "pending" };
  const last = list[0];
  return { state: "not_paid", reason: last?.payment_message || (list.length ? "payment failed" : "no payment was made") };
}

/** Asks Cashfree itself about one of our orders. */
export async function settleCashfreeOrder(orderId: string): Promise<Settlement> {
  const order = await fetchCashfreeOrder(orderId);
  if (order.order_id !== orderId) return { state: "not_paid", reason: "order mismatch" };
  return settlementOf(order, await fetchCashfreePayments(orderId));
}

/** Webhook signature: Base64 of HMAC-SHA256 over timestamp + raw body, keyed with the secret key. */
export function cashfreeWebhookSignature(timestamp: string, rawBody: string, secret: string): string {
  return createHmac("sha256", secret).update(timestamp + rawBody).digest("base64");
}

export function verifyCashfreeWebhook(timestamp: string, rawBody: string, signature: string, secret: string): boolean {
  if (!timestamp || !signature) return false;
  const x = Buffer.from(cashfreeWebhookSignature(timestamp, rawBody, secret), "utf8");
  const y = Buffer.from(signature, "utf8");
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * True when a webhook's timestamp is more than ten minutes away from now (or cannot be read), which
 * is what a captured message sent again later looks like. Cashfree sends the time in milliseconds;
 * seconds are accepted too.
 */
export function isStaleWebhook(timestamp: string, now = Date.now(), maxAgeMs = 10 * 60_000): boolean {
  const n = Number(timestamp);
  if (!timestamp || !Number.isFinite(n) || n <= 0) return true;
  const at = n < 1e12 ? n * 1000 : n;
  return Math.abs(now - at) > maxAgeMs;
}

/**
 * The address Cashfree sends customers back to and reports results to. On the live site this is the
 * site's own configured address, so it can never be steered by the request; elsewhere (a local or
 * preview copy) it is the address the request came in on.
 */
export function paymentOrigin(requestOrigin: string): string {
  if (process.env.VERCEL_ENV !== "production") return requestOrigin;
  try {
    const u = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "");
    return u.protocol === "https:" ? u.origin : requestOrigin;
  } catch {
    return requestOrigin;
  }
}
