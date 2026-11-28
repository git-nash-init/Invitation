import { NextResponse } from "next/server";
import { z } from "zod";
import { cashfreeKeys, isStaleWebhook, settleCashfreeOrder, verifyCashfreeWebhook } from "@/lib/cashfree";
import { confirmPaid, markFailed, markRefunded } from "@/lib/payments";

// Needs the raw body for the signature, so it is read as text and never as JSON first.
export const dynamic = "force-dynamic";

const uuid = z.string().uuid();
type Event = {
  type?: string;
  data?: {
    order?: { order_id?: string };
    payment?: { cf_payment_id?: string | number; payment_status?: string; payment_message?: string };
    refund?: { cf_payment_id?: string | number; refund_status?: string };
  };
};

const ok = (extra: Record<string, unknown> = {}) => NextResponse.json({ ok: true, ...extra });

/**
 * Cashfree's webhook. It still settles a payment when the customer closes the tab straight
 * after paying. Every event is safe to receive more than once.
 */
export async function POST(request: Request) {
  const keys = cashfreeKeys();
  if (!keys) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const raw = await request.text();
  const signature = request.headers.get("x-webhook-signature") ?? "";
  const timestamp = request.headers.get("x-webhook-timestamp") ?? "";
  if (!verifyCashfreeWebhook(timestamp, raw, signature, keys.secret)) {
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  let event: Event;
  try {
    event = JSON.parse(raw) as Event;
  } catch {
    return NextResponse.json({ error: "bad_body" }, { status: 400 });
  }

  // An old message sent again. A success is never taken from the message itself (Cashfree is asked
  // afresh below) and a refund can only be recorded once, so both are still safe to act on, which
  // also keeps Cashfree's own late retries working. A stale failure is the one event that would
  // be believed as written, so it is dropped.
  const stale = isStaleWebhook(timestamp);

  const orderId = event.data?.order?.order_id;
  try {
    switch (event.type) {
      case "PAYMENT_SUCCESS_WEBHOOK": {
        if (!uuid.safeParse(orderId).success) return ok({ ignored: "no_order" });
        // Ask Cashfree again instead of trusting the body, then let the database re-check the amount.
        const s = await settleCashfreeOrder(orderId as string);
        if (s.state === "pending") return NextResponse.json({ error: "retry" }, { status: 500 });
        if (s.state === "not_paid") return ok({ ignored: "not_paid" });
        const done = await confirmPaid({
          orderId: orderId as string,
          gatewayOrderId: orderId as string,
          paymentId: s.paymentId,
          amountPaise: s.amountPaise,
          method: s.method,
        });
        // A mismatch is not something a retry can fix; anything else is, so ask Cashfree to retry.
        if (!done.ok && !/mismatch|not found/i.test(done.error)) {
          return NextResponse.json({ error: "retry" }, { status: 500 });
        }
        return ok();
      }
      case "PAYMENT_FAILED_WEBHOOK": {
        if (stale) return ok({ ignored: "stale" });
        // One order can be tried again in the same window; a later success still marks it paid.
        if (uuid.safeParse(orderId).success) await markFailed(orderId as string, event.data?.payment?.payment_message ?? "payment failed");
        return ok();
      }
      case "REFUND_STATUS_WEBHOOK": {
        const refund = event.data?.refund;
        if (refund?.refund_status === "SUCCESS" && refund.cf_payment_id != null) await markRefunded(String(refund.cf_payment_id));
        return ok();
      }
      default:
        return ok({ ignored: event.type ?? "unknown" });
    }
  } catch {
    return NextResponse.json({ error: "retry" }, { status: 500 });
  }
}
