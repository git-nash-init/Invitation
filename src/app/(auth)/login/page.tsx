import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { GoogleButton } from "@/components/auth/google-button";
import { safeNext } from "@/lib/auth/safe-next";

export const metadata: Metadata = { title: "Log in" };

const ERRORS: Record<string, string> = {
  link: "That link has expired or was already used. Log in or request a new one.",
  google: "Google sign-in is not available right now. Use your email instead.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next: rawNext, error } = await searchParams;
  const next = safeNext(rawNext, "");

  return (
    <div className="glass rounded-[20px] p-8">
      <h1 className="display text-[32px] leading-[1.15]">Log in</h1>
      <p className="mt-2 text-[14px] text-text-2">Pick up where you left off</p>

      {error && ERRORS[error] && (
        <p role="alert" className="mt-5 text-[14px] text-negative">
          {ERRORS[error]}
        </p>
      )}

      <div className="mt-8 grid gap-6">
        <GoogleButton next={next || undefined} label="Continue with Google" />
        <div className="flex items-center gap-4 text-[12px] text-muted">
          <span className="h-px flex-1 bg-(--hairline)" />
          or
          <span className="h-px flex-1 bg-(--hairline)" />
        </div>
        <AuthForm mode="login" next={next || undefined} />
      </div>

      <p className="mt-8 text-[14px] text-text-2">
        New here?{" "}
        <Link href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"} className="link">
          Create an account
        </Link>
      </p>
    </div>
  );
}
