import { NextResponse } from "next/server";
import { z } from "zod";
import { cashfreeKeys, settleCashfreeOrder } from "@/lib/cashfree";
import { getCurrentUser } from "@/lib/invitations/queries";
import { captureIfNeeded, confirmPaid, razorpayKeys, verifyCheckoutSignature } from "@/lib/razorpay";
import { clientIp, isSameOrigin, rateLimit } from "@/lib/security";

const razorpayBody = z.object({
  orderId: z.string().uuid(),
  razorpay_order_id: z.string().regex(/^order_[A-Za-z0-9]{8,40}$/),
  razorpay_payment_id: z.string().regex(/^pay_[A-Za-z0-9]{8,40}$/),
  razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/),
});
const cashfreeBody = z.object({ provider: z.literal("cashfree"), orderId: z.string().uuid() });

const reply = (status: number, json: Record<string, unknown>) =>
  NextResponse.json(json, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Called by the browser right after the payment window says it is finished.
 * The browser's word is not enough. For Razorpay the signature is checked and Razorpay is asked
 * directly; for Cashfree the order is looked up at Cashfree. The webhooks do the same job for
 * payments whose browser never came back.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return reply(403, { error: "forbidden" });
  if (!rateLimit(`verify:${clientIp(request)}`, 30, 10 * 60_000)) return reply(429, { error: "slow_down" });
  if (!(await getCurrentUser())) return reply(401, { error: "sign_in" });

  const json = await request.json().catch(() => null);

  const cf = cashfreeBody.safeParse(json);
  if (cf.success) {
    if (!cashfreeKeys()) return reply(503, { error: "not_configured" });
    try {
      const s = await settleCashfreeOrder(cf.data.orderId);
      if (s.state === "pending") return reply(202, { status: "pending" });
      if (s.state === "not_paid") return reply(200, { status: "not_paid" });
      const done = await confirmPaid({
        orderId: cf.data.orderId,
        razorpayOrderId: cf.data.orderId,
        payment: { id: s.paymentId, order_id: cf.data.orderId, amount: s.amountPaise, currency: "INR", status: "captured", method: s.method ?? undefined },
      });
      if (!done.ok) return reply(409, { error: "order_mismatch" });
      return reply(200, { status: "paid" });
    } catch {
      return reply(202, { status: "pending" });
    }
  }

  const keys = razorpayKeys();
  if (!keys) return reply(503, { error: "not_configured" });

  const parsed = razorpayBody.safeParse(json);
  if (!parsed.success) return reply(400, { error: "bad_request" });
  const b = parsed.data;

  if (!verifyCheckoutSignature(b.razorpay_order_id, b.razorpay_payment_id, b.razorpay_signature, keys.secret)) {
    return reply(400, { error: "bad_signature" });
  }

  try {
    const payment = await captureIfNeeded(b.razorpay_payment_id, b.razorpay_order_id);
    if (!payment) return reply(202, { status: "pending" });
    const done = await confirmPaid({ orderId: b.orderId, razorpayOrderId: b.razorpay_order_id, payment });
    if (!done.ok) return reply(409, { error: "order_mismatch" });
    return reply(200, { status: "paid" });
  } catch {
    // The webhook will still settle it; the page keeps checking.
    return reply(202, { status: "pending" });
  }
}
