"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setStatus } from "@/lib/invitations/actions";

type CashfreeResult = { error?: { message?: string }; redirect?: boolean; paymentDetails?: unknown };
type CashfreeInstance = {
  checkout: (options: { paymentSessionId: string; redirectTarget: "_modal" | "_self" }) => Promise<CashfreeResult>;
};
declare global {
  interface Window {
    Cashfree?: (options: { mode: "sandbox" | "production" }) => CashfreeInstance;
  }
}

type Checkout = {
  alreadyPaid?: boolean;
  provider: "cashfree";
  orderId: string;
  paymentSessionId: string;
  mode: "sandbox" | "production";
};

const scripts = new Map<string, Promise<boolean>>();
function loadScript(src: string): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  let p = scripts.get(src);
  if (!p) {
    p = new Promise<boolean>((resolve) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve(true);
      s.onerror = () => {
        scripts.delete(src);
        resolve(false);
      };
      document.body.appendChild(s);
    });
    scripts.set(src, p);
  }
  return p;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const PHONE_KEY = "pi-checkout-phone";
const validPhone = (v: string) => /^[6-9]\d{9}$/.test(v.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, ""));
const NOT_COMPLETED = "The payment was not completed, so you have not been charged. You can try again.";

/**
 * Opens the Cashfree payment window, waits for the
 * server to confirm the payment, then publishes. If the confirmation is slow (the webhook is
 * still on its way), it keeps checking for a short while.
 *
 * `askPhone` shows a mobile-number field: Cashfree needs it for every payment.
 * `resumeOrderId` is set when a bank or UPI app has just sent the customer back to this page.
 */
export function CheckoutButton({
  invitationId,
  label,
  askPhone = false,
  resumeOrderId,
}: {
  invitationId: string;
  label: string;
  /** What is being bought, in a few words. Kept for callers; the payment window shows the order itself. */
  description?: string;
  askPhone?: boolean;
  resumeOrderId?: string;
}) {
  const router = useRouter();
  const phoneId = useId();
  const [state, setState] = useState<"idle" | "opening" | "confirming">("idle");
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const resumed = useRef(false);

  useEffect(() => {
    if (!askPhone) return;
    try {
      const saved = window.localStorage.getItem(PHONE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from the browser after mount
      if (saved) setPhone(saved);
    } catch {
      /* private window: nothing remembered */
    }
  }, [askPhone]);

  async function publishAndGo() {
    const res = await setStatus(invitationId, "published");
    if (!res.ok) {
      setError(res.error);
      setState("idle");
      return;
    }
    router.push(`/dashboard/${invitationId}/guests?published=1`);
    router.refresh();
  }

  async function confirm(body: Record<string, unknown>, sawPayment: boolean) {
    setState("confirming");
    for (let attempt = 0; attempt < 12; attempt++) {
      const res = await fetch("/api/checkout/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).catch(() => null);
      if (res?.status === 200) {
        const json = (await res.json().catch(() => ({}))) as { status?: string };
        if (json.status === "paid") return publishAndGo();
        setError(NOT_COMPLETED);
        return setState("idle");
      }
      if (res && res.status >= 400 && res.status !== 429) break;
      await sleep(2500);
    }
    setError(
      sawPayment
        ? "Your payment went through, but we are still confirming it. Wait a minute and refresh this page. You will not be charged twice."
        : "We are still checking this payment. Wait a minute and refresh this page. You will not be charged twice.",
    );
    setState("idle");
  }

  // Back from a bank or UPI app: check that order straight away.
  useEffect(() => {
    if (!resumeOrderId || resumed.current) return;
    resumed.current = true;
    void confirm({ provider: "cashfree", orderId: resumeOrderId }, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeOrderId]);

  async function payWithCashfree(data: Partial<Checkout>) {
    if (!data.paymentSessionId || !data.orderId || !data.mode) {
      setError("We could not start the payment. Please try again.");
      return setState("idle");
    }
    if (!(await loadScript("https://sdk.cashfree.com/js/v3/cashfree.js")) || !window.Cashfree) {
      setError("The payment window could not load. Check your connection and try again.");
      return setState("idle");
    }
    const result = await window.Cashfree({ mode: data.mode }).checkout({
      paymentSessionId: data.paymentSessionId,
      redirectTarget: "_modal",
    });
    // The page is leaving for a bank or UPI app; it comes back with the order in the address.
    if (result.redirect) return;
    // Closed without paying and a real attempt both end here, so always ask the server.
    return confirm({ provider: "cashfree", orderId: data.orderId }, Boolean(result.paymentDetails));
  }

  async function start() {
    setError("");
    if (askPhone && !validPhone(phone)) {
      setError("Enter your 10-digit mobile number to continue. It is needed for the payment.");
      document.getElementById(phoneId)?.focus();
      return;
    }
    setState("opening");
    try {
      if (askPhone) {
        try {
          window.localStorage.setItem(PHONE_KEY, phone);
        } catch {
          /* not remembered, nothing else changes */
        }
      }
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(askPhone ? { invitationId, phone } : { invitationId }),
      });
      const data = (await res.json().catch(() => ({}))) as Partial<Checkout> & { error?: string };

      if (data.alreadyPaid) return publishAndGo();
      if (res.status === 503) {
        setError("Payments are not switched on yet. Please try again soon.");
        return setState("idle");
      }
      if (res.status === 401) return router.push(`/login?next=${encodeURIComponent(`/studio/${invitationId}/publish`)}`);
      if (data.error === "phone_required") {
        setError("Enter your 10-digit mobile number to continue. It is needed for the payment.");
        return setState("idle");
      }
      if (!res.ok) {
        setError("We could not start the payment. Please try again.");
        return setState("idle");
      }
      return await payWithCashfree(data);
    } catch {
      setError("Something went wrong. Please try again.");
      setState("idle");
    }
  }

  const busy = state !== "idle";
  return (
    <div>
      {askPhone && (
        <div className="mb-4 text-left">
          <label htmlFor={phoneId} className="mb-1.5 block text-[14px] font-semibold">
            Mobile number
          </label>
          <input
            id={phoneId}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="10-digit mobile number"
            maxLength={16}
            value={phone}
            disabled={busy}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d+ ]/g, ""))}
            className="num h-12 w-full rounded-xl border border-black/15 bg-white px-4 text-[16px] text-[#2b1210] outline-none placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-[#f5a300]"
          />
          <p className="mt-1.5 text-[13px] opacity-75">Needed by the payment partner for your receipt. We do not use it for anything else.</p>
        </div>
      )}
      <Button size="lg" className="btn-glint w-full" onClick={start} disabled={busy}>
        {busy ? (
          <>
            <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            {state === "confirming" ? "Confirming your payment" : "Opening secure payment"}
          </>
        ) : (
          <>
            <Lock size={17} strokeWidth={2.25} aria-hidden="true" />
            {label}
          </>
        )}
      </Button>
      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-[rgba(198,40,57,0.08)] p-3 text-[14px] leading-5 text-negative">
          {error}
        </p>
      )}
    </div>
  );
}
