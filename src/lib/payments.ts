import { createClient as createSupabase } from "@supabase/supabase-js";

/**
 * The bridge between a confirmed payment and the database. Server side only.
 *
 * The functions it calls are guarded by a secret that lives in this server's environment and in
 * Supabase Vault, so nothing in a browser can mark an order paid. The database also re-checks the
 * order id and the amount.
 *
 * The orders table still names two of its columns razorpay_order_id and razorpay_payment_id, from
 * the gateway the site started with. They hold Cashfree's order id and payment id now.
 */

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

/** Marks our order paid. The database re-checks the gateway's order id and the amount. */
export async function confirmPaid(args: {
  orderId: string;
  gatewayOrderId: string;
  paymentId: string;
  amountPaise: number;
  method?: string | null;
}): Promise<{ ok: true; already: boolean } | { ok: false; error: string }> {
  const { data, error } = await db().rpc("service_confirm_payment", {
    p_secret: bridgeSecret(),
    p_order_id: args.orderId,
    p_razorpay_order_id: args.gatewayOrderId,
    p_payment_id: args.paymentId,
    p_amount_paise: args.amountPaise,
    p_method: args.method ?? null,
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
