import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { GoogleButton } from "@/components/auth/google-button";
import { safeNext } from "@/lib/auth/safe-next";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next: rawNext } = await searchParams;
  const next = safeNext(rawNext, "");

  return (
    <div className="glass rounded-[20px] p-8">
      <h1 className="display text-[32px] leading-[1.15]">Create your account</h1>
      <p className="mt-2 text-[14px] text-text-2">Start an invitation in a few minutes</p>

      <div className="mt-8 grid gap-6">
        <GoogleButton next={next || undefined} label="Sign up with Google" />
        <div className="flex items-center gap-4 text-[12px] text-muted">
          <span className="h-px flex-1 bg-(--hairline)" />
          or
          <span className="h-px flex-1 bg-(--hairline)" />
        </div>
        <AuthForm mode="signup" next={next || undefined} />
      </div>

      <p className="mt-6 text-[12px] leading-4 text-muted">
        By continuing you agree to the{" "}
        <Link href="/terms" className="link">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="link">
          Privacy Policy
        </Link>
        .
      </p>

      <p className="mt-6 text-[14px] text-text-2">
        Already have an account?{" "}
        <Link href="/login" className="link">
          Log in
        </Link>
      </p>
    </div>
  );
}
