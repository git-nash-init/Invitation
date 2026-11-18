import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <div className="glass rounded-[20px] p-8">
      <h1 className="display text-[32px] leading-[1.15]">Reset your password</h1>
      <p className="mt-2 text-[14px] text-text-2">
        Enter your email and we will send you a reset link
      </p>
      <div className="mt-8">
        <AuthForm mode="forgot" />
      </div>
      <p className="mt-8 text-[14px] text-text-2">
        <Link href="/login" className="link">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
