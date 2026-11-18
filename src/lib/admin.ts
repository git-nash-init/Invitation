import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/invitations/queries";

/**
 * Only people in the `admins` table get past this. Everyone else sees a normal
 * "not found" page, so the panel does not even reveal that it exists.
 */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_admin");
  if (!data) notFound();
  return user;
}

/** Calls one of the guarded admin_* database functions as the signed-in admin. */
export async function adminRpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(fn, args);
  if (error) return null;
  return data as T;
}
