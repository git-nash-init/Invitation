import { NextResponse } from "next/server";
import { z } from "zod";
import { cashfreeKeys, settleCashfreeOrder } from "@/lib/cashfree";
import { getCurrentUser } from "@/lib/invitations/queries";
import { confirmPaid } from "@/lib/payments";
import { clientIp, isSameOrigin, rateLimit } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

const body = z.object({ provider: z.literal("cashfree"), orderId: z.string().uuid() });

const reply = (status: number, json: Record<string, unknown>) =>
  NextResponse.json(json, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Called by the browser right after the payment window says it is finished.
 * The browser's word is not enough: the order is looked up at Cashfree, and the database re-checks
 * the amount. The webhook does the same job for payments whose browser never came back.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return reply(403, { error: "forbidden" });
  if (!rateLimit(`verify:${clientIp(request)}`, 30, 10 * 60_000)) return reply(429, { error: "slow_down" });
  if (!(await getCurrentUser())) return reply(401, { error: "sign_in" });
  if (!cashfreeKeys()) return reply(503, { error: "not_configured" });

  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return reply(400, { error: "bad_request" });
  const orderId = parsed.data.orderId;

  // Only the person who started an order may ask about it. The orders table shows each account its
  // own rows and nobody else's, so someone else's order id simply is not found.
  const supabase = await createClient();
  const { data: mine } = await supabase.from("orders").select("id").eq("id", orderId).maybeSingle();
  if (!mine) return reply(404, { error: "not_found" });

  try {
    const s = await settleCashfreeOrder(orderId);
    if (s.state === "pending") return reply(202, { status: "pending" });
    if (s.state === "not_paid") return reply(200, { status: "not_paid" });
    const done = await confirmPaid({
      orderId,
      gatewayOrderId: orderId,
      paymentId: s.paymentId,
      amountPaise: s.amountPaise,
      method: s.method,
    });
    if (!done.ok) return reply(409, { error: "order_mismatch" });
    return reply(200, { status: "paid" });
  } catch {
    // The webhook will still settle it; the page keeps checking.
    return reply(202, { status: "pending" });
  }
}
