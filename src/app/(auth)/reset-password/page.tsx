import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage() {
  // The reset link signs the user in through /auth/callback first.
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/forgot-password");

  return (
    <div className="glass rounded-[20px] p-8">
      <h1 className="display text-[32px] leading-[1.15]">Choose a new password</h1>
      <div className="mt-8">
        <AuthForm mode="reset" />
      </div>
    </div>
  );
}
