"use client";

import Link from "next/link";
import { useActionState } from "react";
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

  return (
    <form action={formAction} className="grid gap-5" noValidate>
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

      <Button type="submit" size="lg" loading={pending} className="w-full">
        {pending ? PENDING_LABEL[mode] : SUBMIT_LABEL[mode]}
      </Button>
    </form>
  );
}
