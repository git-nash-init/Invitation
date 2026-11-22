"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  logIn,
  signUp,
  requestPasswordReset,
  updatePassword,
  type AuthState,
} from "@/lib/auth/actions";

type Mode = "login" | "signup" | "forgot" | "reset";

const ACTIONS: Record<Mode, (s: AuthState, f: FormData) => Promise<AuthState>> = {
  login: logIn,
  signup: signUp,
  forgot: requestPasswordReset,
  reset: updatePassword,
};

const SUBMIT_LABEL: Record<Mode, string> = {
  login: "Log in",
  signup: "Create account",
  forgot: "Send reset link",
  reset: "Save new password",
};

const PENDING_LABEL: Record<Mode, string> = {
  login: "Logging you in",
  signup: "Creating your account",
  forgot: "Sending the link",
  reset: "Saving",
};

export function AuthForm({ mode, next }: { mode: Mode; next?: string }) {
  const [state, formAction, pending] = useActionState(ACTIONS[mode], undefined);

  // After a sign-up that needs the email confirmed, a pop-up says so, and the button stays locked until
  // the person changes something, so the same details are not sent again and again.
  const [closed, setClosed] = useState<AuthState>(undefined);
  const [edited, setEdited] = useState<AuthState>(undefined);
  const sent = mode === "signup" && !!state?.message;
  const showPopup = sent && closed !== state;
  const locked = sent && edited !== state;
  const gotIt = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showPopup) return;
    gotIt.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setClosed(state);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showPopup, state]);

  return (
    <form action={formAction} onChange={() => sent && setEdited(state)} className="grid gap-5" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {mode === "signup" && (
        <div>
          <label htmlFor="name" className="label">
            Your name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            defaultValue={state?.name ?? ""}
            required
            maxLength={80}
            className="field"
          />
        </div>
      )}

      {mode !== "reset" && (
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={state?.email ?? ""}
            required
            maxLength={254}
            className="field"
          />
        </div>
      )}

      {mode !== "forgot" && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="password" className="label !mb-0">
              {mode === "reset" ? "New password" : "Password"}
            </label>
            {mode === "login" && (
              <Link href="/forgot-password" className="text-[13px] text-text-2 hover:text-text">
                Forgot password
              </Link>
            )}
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            maxLength={72}
            className="field"
            aria-describedby={mode !== "login" ? "password-hint" : undefined}
          />
          {mode !== "login" && (
            <p id="password-hint" className="mt-2 text-[12px] leading-4 text-muted">
              At least 8 characters, with a letter and a number
            </p>
          )}
        </div>
      )}

      <div aria-live="polite" className="min-h-0">
        {state?.error && (
          <p role="alert" className="text-[14px] text-negative">
            {state.error}
          </p>
        )}
        {state?.message && <p className="text-[14px] text-positive">{state.message}</p>}
      </div>

      <Button type="submit" size="lg" loading={pending} disabled={locked} className="w-full">
        {pending ? PENDING_LABEL[mode] : locked ? "Confirmation email sent" : SUBMIT_LABEL[mode]}
      </Button>

      {showPopup && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setClosed(state)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sent-title"
            aria-describedby="sent-body"
            className="glass-strong w-full max-w-sm rounded-[24px] p-7 text-center shadow-[0_30px_80px_rgba(74,10,30,0.4)]"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-[rgba(245,163,0,0.18)] text-[#9f1239]">
              <MailCheck size={28} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <h2 id="sent-title" className="display mt-4 text-[28px] leading-[1.15]">
              Check your email
            </h2>
            <p id="sent-body" className="mt-3 text-[15px] leading-6 text-text-2">
              We sent a confirmation link to{" "}
              <strong className="break-all font-semibold text-text">{state?.email}</strong>. Open it to finish signing up,
              then choose your design. You do not need to register again.
            </p>
            <p className="mt-2 text-[13px] leading-5 text-muted">Cannot see it? Look in spam or promotions.</p>
            <button
              ref={gotIt}
              type="button"
              className="btn btn-primary btn-lg mt-6 w-full"
              onClick={() => setClosed(state)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
