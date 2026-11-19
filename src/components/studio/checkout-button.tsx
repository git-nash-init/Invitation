"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setStatus } from "@/lib/invitations/actions";
import { BRAND } from "@/lib/brand";

type RazorpaySuccess = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayInstance = { open: () => void; on: (event: string, cb: (r: { error?: { description?: string } }) => void) => void };
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

type Checkout = {
  alreadyPaid?: boolean;
  keyId: string;
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  email: string;
  name: string;
};

let scriptPromise: Promise<boolean> | null = null;
function loadCheckout(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  scriptPromise ??= new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => {
      scriptPromise = null;
      resolve(false);
    };
    document.body.appendChild(s);
  });
  return scriptPromise;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Opens Razorpay Checkout, waits for the server to confirm the payment, then publishes.
 * If the confirmation is slow (the webhook is still on its way), it keeps checking for a short while.
 */
export function CheckoutButton({
  invitationId,
  label,
  description,
}: {
  invitationId: string;
  label: string;
  description: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "opening" | "confirming">("idle");
  const [error, setError] = useState("");

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

  async function confirm(orderId: string, r: RazorpaySuccess) {
    setState("confirming");
    for (let attempt = 0; attempt < 12; attempt++) {
      const res = await fetch("/api/checkout/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, ...r }),
      }).catch(() => null);
      if (res?.status === 200) return publishAndGo();
      if (res && res.status >= 400 && res.status !== 429) break;
      await sleep(2500);
    }
    setError(
      "Your payment went through, but we are still confirming it. Wait a minute and refresh this page. You will not be charged twice.",
    );
    setState("idle");
  }

  async function start() {
    setError("");
    setState("opening");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId }),
      });
      const data = (await res.json().catch(() => ({}))) as Partial<Checkout> & { error?: string };

      if (data.alreadyPaid) return publishAndGo();
      if (res.status === 503) {
        setError("Payments are not switched on yet. Please try again soon.");
        return setState("idle");
      }
      if (res.status === 401) return router.push(`/login?next=${encodeURIComponent(`/studio/${invitationId}/publish`)}`);
      if (!res.ok || !data.keyId || !data.razorpayOrderId || !data.orderId) {
        setError("We could not start the payment. Please try again.");
        return setState("idle");
      }

      if (!(await loadCheckout()) || !window.Razorpay) {
        setError("The payment window could not load. Check your connection and try again.");
        return setState("idle");
      }

      const orderId = data.orderId;
      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: BRAND.name,
        description,
        order_id: data.razorpayOrderId,
        prefill: { email: data.email, name: data.name },
        notes: { invitation_id: invitationId },
        theme: { color: "#6B0F2B" },
        modal: { ondismiss: () => setState((s) => (s === "opening" ? "idle" : s)) },
        handler: (r: RazorpaySuccess) => void confirm(orderId, r),
      });
      rzp.on("payment.failed", (r) => {
        setError(r.error?.description ?? "The payment did not go through. You have not been charged. Please try again.");
        setState("idle");
      });
      rzp.open();
    } catch {
      setError("Something went wrong. Please try again.");
      setState("idle");
    }
  }

  const busy = state !== "idle";
  return (
    <div>
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
