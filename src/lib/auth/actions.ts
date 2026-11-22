"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "./safe-next";

export type AuthState = { error?: string; message?: string; email?: string; name?: string } | undefined;

const keep = (f: FormData) => ({
  email: String(f.get("email") ?? "").slice(0, 254),
  name: String(f.get("name") ?? "").slice(0, 80),
});

const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(254);
const password = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Use 72 characters or fewer")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number");

async function getOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function firstError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Check the form and try again";
}

export async function logIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = z
    .object({ email, password: z.string().min(1, "Enter your password").max(72) })
    .safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: firstError(parsed.error), ...keep(formData) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // One message for every failure, so the form never reveals which emails exist.
    return { error: "Email or password is incorrect", ...keep(formData) };
  }

  redirect(safeNext(String(formData.get("next") ?? ""), "/dashboard"));
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = z
    .object({
      name: z.string().trim().min(1, "Enter your name").max(80),
      email,
      password,
    })
    .safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    });
  if (!parsed.success) return { error: firstError(parsed.error), ...keep(formData) };

  const origin = await getOrigin();
  // A new person lands on the designs to choose from, unless they came from a specific one (?next=).
  const next = safeNext(String(formData.get("next") ?? ""), "/templates");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.name },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    // The sign-up itself can be fine while the confirmation email cannot be sent (the mail service's hourly
    // limit, or no sender set up). Say so, instead of blaming the person's details.
    if (error.status === 429 || error.status === 500 || /email/i.test(error.message) && /send|rate|limit/i.test(error.message)) {
      return {
        error: "We could not send the confirmation email just now. Please use Continue with Google, or try again in a little while.",
        ...keep(formData),
      };
    }
    return { error: "We could not create that account. Try a different email or log in.", ...keep(formData) };
  }

  // With email confirmation on, there is no session yet.
  if (!data.session) {
    return { message: "Check your email for a confirmation link to finish signing up.", email: parsed.data.email, name: parsed.data.name };
  }
  redirect(next);
}

export async function signInWithGoogle(formData: FormData) {
  const origin = await getOrigin();
  const next = safeNext(String(formData.get("next") ?? ""), "/dashboard");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) {
    redirect("/login?error=google");
  }
  redirect(data.url);
}

export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = email.safeParse(formData.get("email"));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const origin = await getOrigin();
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  // Same answer whether or not the account exists.
  return { message: "If that email has an account, a reset link is on its way." };
}

export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = password.safeParse(formData.get("password"));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return { error: "This reset link has expired. Request a new one." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { error: "We could not update the password. Try again." };

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
