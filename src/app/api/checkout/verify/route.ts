import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/invitations/queries";
import { captureIfNeeded, confirmPaid, razorpayKeys, verifyCheckoutSignature } from "@/lib/razorpay";
import { clientIp, isSameOrigin, rateLimit } from "@/lib/security";

const body = z.object({
  orderId: z.string().uuid(),
  razorpay_order_id: z.string().regex(/^order_[A-Za-z0-9]{8,40}$/),
  razorpay_payment_id: z.string().regex(/^pay_[A-Za-z0-9]{8,40}$/),
  razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/),
});

const reply = (status: number, json: Record<string, unknown>) =>
  NextResponse.json(json, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Called by the browser right after Razorpay Checkout says it succeeded.
 * The browser's word is not enough: the signature is checked, then Razorpay is asked directly.
 * The webhook does the same job for payments whose browser never came back.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return reply(403, { error: "forbidden" });
  if (!rateLimit(`verify:${clientIp(request)}`, 30, 10 * 60_000)) return reply(429, { error: "slow_down" });
  if (!(await getCurrentUser())) return reply(401, { error: "sign_in" });

  const keys = razorpayKeys();
  if (!keys) return reply(503, { error: "not_configured" });

  const parsed = body.safeParse(await request.json().catch(() => null));
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
