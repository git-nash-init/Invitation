import type { Metadata } from "next";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { SITE_URL } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Payments setup" };

const has = (name: string, min = 1) => (process.env[name] ?? "").trim().length >= min;

function Row({ ok, title, children }: { ok: boolean; title: string; children?: React.ReactNode }) {
  const Icon = ok ? CheckCircle2 : CircleAlert;
  return (
    <li className="flex gap-3 py-4">
      <Icon size={22} strokeWidth={1.9} className={`mt-0.5 shrink-0 ${ok ? "text-positive" : "text-[#c97a00]"}`} aria-hidden="true" />
      <div>
        <p className="text-[16px] font-semibold">
          {title} <span className="sr-only">{ok ? "is set" : "needs attention"}</span>
        </p>
        {children && <div className="mt-1 text-[14px] leading-5 text-text-2">{children}</div>}
      </div>
    </li>
  );
}

/** A plain checklist of what the payment flow needs. It reads names only, never values. */
export default async function SetupPage() {
  const keyId = (process.env.RAZORPAY_KEY_ID ?? "").trim();
  const mode = keyId.startsWith("rzp_live_") ? "Live" : keyId.startsWith("rzp_test_") ? "Test" : null;

  const supabase = await createClient();
  const { data: priced } = await supabase.from("templates").select("slug").eq("is_active", true).gt("price", 0);

  return (
    <>
      <h1 className="display text-[36px] leading-[1.1]">Payments setup</h1>
      <p className="mt-2 max-w-[42rem] text-[15px] leading-6 text-text-2">
        Everything the payment flow needs. Green means it is ready. Values are never shown here.
      </p>

      <ul className="glass mt-6 divide-y divide-(--hairline) rounded-[20px] px-6">
        <Row ok={has("RAZORPAY_KEY_ID") && has("NEXT_PUBLIC_RAZORPAY_KEY_ID") && has("RAZORPAY_KEY_SECRET")} title="Razorpay keys">
          Set <code className="num">RAZORPAY_KEY_ID</code>, <code className="num">NEXT_PUBLIC_RAZORPAY_KEY_ID</code> (the same Key ID) and{" "}
          <code className="num">RAZORPAY_KEY_SECRET</code> in Vercel, then redeploy.
          {mode && (
            <span className="mt-1 block font-semibold text-maroon">
              Running in {mode} mode.{mode === "Test" && " No real money moves until you switch to live keys."}
            </span>
          )}
        </Row>
        <Row ok={has("RAZORPAY_WEBHOOK_SECRET")} title="Webhook secret">
          Set <code className="num">RAZORPAY_WEBHOOK_SECRET</code> in Vercel to the same secret you typed in Razorpay when you created the webhook.
        </Row>
        <Row ok title="Webhook address in Razorpay">
          In Razorpay, Settings, Webhooks, add{" "}
          <code className="num break-all rounded bg-[rgba(107,15,43,0.07)] px-1.5 py-0.5">{SITE_URL}/api/razorpay/webhook</code> and tick{" "}
          <b>payment.captured</b>, <b>order.paid</b>, <b>payment.failed</b> and <b>refund.processed</b>. This cannot be checked from here.
        </Row>
        <Row ok={has("PAYMENT_BRIDGE_SECRET", 32)} title="Payment confirmation secret">
          <code className="num">PAYMENT_BRIDGE_SECRET</code> lets this site tell the database a payment is confirmed. It must match the one stored in Supabase Vault.
        </Row>
        <Row ok={(priced?.length ?? 0) > 0} title="Designs have a price">
          Set prices under Templates. {priced?.length ?? 0} design{priced?.length === 1 ? " has" : "s have"} one.
        </Row>
        <Row ok={has("ASSET_TOKEN_SECRET", 32)} title="Template protection secret">
          <code className="num">ASSET_TOKEN_SECRET</code> signs the short-lived links that unlock template files.
        </Row>
      </ul>
    </>
  );
}
