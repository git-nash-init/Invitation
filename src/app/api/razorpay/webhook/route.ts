import { NextResponse } from "next/server";
import { z } from "zod";
import { captureIfNeeded, confirmPaid, markFailed, markRefunded, verifyWebhookSignature, webhookSecret } from "@/lib/razorpay";

// Needs the raw body for the signature, so it is read as text and never as JSON first.
export const dynamic = "force-dynamic";

const uuid = z.string().uuid();
type Entity = {
  id?: string;
  order_id?: string;
  amount?: number;
  method?: string;
  notes?: Record<string, string> | unknown[];
  error_description?: string;
  payment_id?: string;
};
type Event = {
  event?: string;
  payload?: { payment?: { entity?: Entity }; order?: { entity?: Entity }; refund?: { entity?: Entity } };
};

const ok = (extra: Record<string, unknown> = {}) => NextResponse.json({ ok: true, ...extra });

/** Our own order id, which we put in the Razorpay order's notes when we created it. */
function ourOrderId(e: Entity | undefined): string | null {
  const notes = e?.notes;
  const id = notes && !Array.isArray(notes) ? notes.order_id : undefined;
  return uuid.safeParse(id).success ? (id as string) : null;
}

/**
 * Razorpay's webhook. The source of truth for payments: it still works when the customer
 * closes the tab straight after paying. Every event is safe to receive more than once.
 */
export async function POST(request: Request) {
  const secret = webhookSecret();
  if (!secret) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!signature || !verifyWebhookSignature(raw, signature, secret)) {
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  let event: Event;
  try {
    event = JSON.parse(raw) as Event;
  } catch {
    return NextResponse.json({ error: "bad_body" }, { status: 400 });
  }

  const payment = event.payload?.payment?.entity;
  try {
    switch (event.event) {
      case "payment.captured":
      case "order.paid": {
        const orderId = ourOrderId(payment);
        if (!payment?.id || !payment.order_id || !orderId) return ok({ ignored: "no_order" });
        // Ask Razorpay again instead of trusting the body, then let the database re-check the amount.
        const confirmed = await captureIfNeeded(payment.id, payment.order_id);
        if (!confirmed) return ok({ ignored: "not_captured" });
        const done = await confirmPaid({ orderId, razorpayOrderId: payment.order_id, payment: confirmed });
        // A mismatch is not something a retry can fix; anything else is, so ask Razorpay to retry.
        if (!done.ok && !/mismatch|not found/i.test(done.error)) {
          return NextResponse.json({ error: "retry" }, { status: 500 });
        }
        return ok();
      }
      case "payment.failed": {
        const orderId = ourOrderId(payment);
        if (orderId) await markFailed(orderId, payment?.error_description ?? "payment failed");
        return ok();
      }
      case "refund.processed": {
        const paymentId = event.payload?.refund?.entity?.payment_id;
        if (paymentId) await markRefunded(paymentId);
        return ok();
      }
      default:
        return ok({ ignored: event.event ?? "unknown" });
    }
  } catch {
    return NextResponse.json({ error: "retry" }, { status: 500 });
  }
}
