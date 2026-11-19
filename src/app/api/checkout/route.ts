import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/invitations/queries";
import { RazorpayError, createRazorpayOrder, razorpayKeys } from "@/lib/razorpay";
import { clientIp, isSameOrigin, rateLimit } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

const body = z.object({ invitationId: z.string().uuid() });
const no = (status: number, error: string) => NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Starts a checkout for one invitation. The price is read from the database inside
 * create_order(); nothing about the amount is taken from the browser.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return no(403, "forbidden");
  if (!rateLimit(`checkout:${clientIp(request)}`, 20, 10 * 60_000)) return no(429, "slow_down");

  const user = await getCurrentUser();
  if (!user) return no(401, "sign_in");

  const keys = razorpayKeys();
  if (!keys) return no(503, "not_configured");

  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return no(400, "bad_request");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_order", { p_invitation_id: parsed.data.invitationId });
  if (error || !data) return no(404, "not_found");
  const order = data as { already_paid?: boolean; order_id: string; amount_paise: number; currency: string };
  if (order.already_paid) return NextResponse.json({ alreadyPaid: true });

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
        keyId: keys.id,
        orderId: order.order_id,
        razorpayOrderId: rz.id,
        amount: order.amount_paise,
        currency: order.currency,
        email: user.email,
        name: user.name,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return no(e instanceof RazorpayError && e.status < 500 ? 502 : 500, "razorpay_failed");
  }
}
