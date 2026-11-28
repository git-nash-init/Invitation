import { NextResponse } from "next/server";
import { z } from "zod";
import { CashfreeError, cashfreeKeys, cleanPhone, createCashfreeOrder } from "@/lib/cashfree";
import { getCurrentUser } from "@/lib/invitations/queries";
import { RazorpayError, createRazorpayOrder, razorpayKeys } from "@/lib/razorpay";
import { clientIp, isSameOrigin, rateLimit } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

const body = z.object({ invitationId: z.string().uuid(), phone: z.string().max(20).optional() });
const no = (status: number, error: string) => NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
const noStore = { headers: { "Cache-Control": "no-store" } };

/**
 * Starts a checkout for one invitation. The price is read from the database inside
 * create_order(); nothing about the amount is taken from the browser.
 * Cashfree is used when its keys are set; otherwise Razorpay.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return no(403, "forbidden");
  if (!rateLimit(`checkout:${clientIp(request)}`, 20, 10 * 60_000)) return no(429, "slow_down");

  const user = await getCurrentUser();
  if (!user) return no(401, "sign_in");

  const cashfree = cashfreeKeys();
  const razorpay = cashfree ? null : razorpayKeys();
  if (!cashfree && !razorpay) return no(503, "not_configured");

  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return no(400, "bad_request");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_order", { p_invitation_id: parsed.data.invitationId });
  if (error || !data) return no(404, "not_found");
  const order = data as { already_paid?: boolean; order_id: string; amount_paise: number; currency: string };
  if (order.already_paid) return NextResponse.json({ alreadyPaid: true });

  if (cashfree) {
    // Cashfree needs the payer's mobile number for every order.
    const phone = cleanPhone(parsed.data.phone);
    if (!phone) return no(400, "phone_required");
    const origin = new URL(request.url).origin;
    try {
      const cf = await createCashfreeOrder({
        orderId: order.order_id,
        amountPaise: order.amount_paise,
        currency: order.currency,
        customer: { id: user.id, phone, email: user.email, name: user.name },
        // Used only when a bank or UPI app sends the customer away and back again.
        returnUrl: `${origin}/studio/${parsed.data.invitationId}/publish?cf_order={order_id}`,
        notifyUrl: origin.startsWith("https://") ? `${origin}/api/cashfree/webhook` : undefined,
        note: `Invitation ${parsed.data.invitationId}`,
      });
      if (!cf.payment_session_id) return no(502, "cashfree_failed");
      const attach = await supabase.rpc("attach_cashfree_order", { p_order_id: order.order_id });
      if (attach.error) return no(500, "attach_failed");
      return NextResponse.json(
        { provider: "cashfree", orderId: order.order_id, paymentSessionId: cf.payment_session_id, mode: cashfree.mode },
        noStore,
      );
    } catch (e) {
      return no(e instanceof CashfreeError && e.status < 500 ? 502 : 500, "cashfree_failed");
    }
  }

  try {
    const rz = await createRazorpayOrder({
      amountPaise: order.amount_paise,
      currency: order.currency,
      receipt: order.order_id,
      notes: { order_id: order.order_id, invitation_id: parsed.data.invitationId },
    });
    const attach = await supabase.rpc("attach_razorpay_order", {
      p_order_id: order.order_id,
      p_razorpay_order_id: rz.id,
    });
    if (attach.error) return no(500, "attach_failed");

    return NextResponse.json(
      {
        provider: "razorpay",
        keyId: razorpay!.id,
        orderId: order.order_id,
        razorpayOrderId: rz.id,
        amount: order.amount_paise,
        currency: order.currency,
        email: user.email,
        name: user.name,
      },
      noStore,
    );
  } catch (e) {
    return no(e instanceof RazorpayError && e.status < 500 ? 502 : 500, "razorpay_failed");
  }
}
