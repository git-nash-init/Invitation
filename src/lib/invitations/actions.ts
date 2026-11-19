"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./queries";
import { cleanText, sanitizeConfig } from "./sanitize";

const uuid = z.string().uuid();
const templateSlug = z.string().regex(/^[a-z0-9-]{2,40}$/);

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

async function requireUser(nextPath: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

/** Called from the template page's "Use this template" form. */
export async function startInvitation(slug: string): Promise<void> {
  const parsedSlug = templateSlug.safeParse(slug);
  if (!parsedSlug.success) redirect("/templates");
  await requireUser(`/preview/${parsedSlug.data}?start=1`);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invitations")
    .insert({ template_slug: parsedSlug.data, title: "Our wedding invitation" })
    .select("id")
    .single();

  if (error || !data) {
    // Safety net: older databases refused creation without a paid credit.
    if (error?.code === "P0001") redirect(`/preview/${parsedSlug.data}`);
    redirect("/dashboard?error=create");
  }
  redirect(`/studio/${data.id}`);
}

/** Receives the config the template's own editor saves. */
export async function saveConfig(id: string, rawConfig: unknown): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return { ok: false, error: "Invitation not found" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in again" };

  const config = sanitizeConfig(rawConfig);
  if (!config) return { ok: false, error: "That invitation is too large to save" };

  const supabase = await createClient();
  const { error, count } = await supabase
    .from("invitations")
    .update({ config }, { count: "exact" })
    .eq("id", id);

  if (error || !count) return { ok: false, error: "We could not save your changes" };
  return { ok: true };
}

export async function setStatus(id: string, status: "published" | "draft"): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return { ok: false, error: "Invitation not found" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in again" };

  const supabase = await createClient();
  const { error, count } = await supabase
    .from("invitations")
    .update({ status }, { count: "exact" })
    .eq("id", id);
  if (error || !count) return { ok: false, error: "We could not update the invitation" };

  revalidatePath("/dashboard");
  revalidatePath(`/studio/${id}`);
  return { ok: true };
}

const settingsSchema = z.object({
  title: z.string().trim().min(1, "Give the invitation a name").max(120),
  guest_mode: z.enum(["common", "personalised"]),
});

export async function updateSettings(
  id: string,
  input: { title: string; guest_mode: string },
): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return { ok: false, error: "Invitation not found" };
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in again" };

  const supabase = await createClient();
  const { error, count } = await supabase
    .from("invitations")
    .update(
      { title: cleanText(parsed.data.title, 120), guest_mode: parsed.data.guest_mode },
      { count: "exact" },
    )
    .eq("id", id);
  if (error || !count) return { ok: false, error: "We could not save the settings" };

  revalidatePath(`/studio/${id}`);
  revalidatePath(`/dashboard/${id}/guests`);
  return { ok: true };
}

export async function deleteInvitation(id: string): Promise<void> {
  if (!uuid.safeParse(id).success) redirect("/dashboard");
  await requireUser("/dashboard");
  const supabase = await createClient();
  await supabase.from("invitations").delete().eq("id", id);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

/** One guest name per line. Blank lines and duplicates are dropped. */
export async function addGuests(id: string, namesText: string): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return { ok: false, error: "Invitation not found" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in again" };

  const names = Array.from(
    new Set(
      String(namesText)
        .split(/\r?\n/)
        .map((n) => cleanText(n.trim(), 80))
        .filter((n) => n.length > 0),
    ),
  );
  if (names.length === 0) return { ok: false, error: "Enter at least one guest name" };
  if (names.length > 200) return { ok: false, error: "Add up to 200 guests at a time" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("guests")
    .insert(names.map((name) => ({ invitation_id: id, name })));
  if (error) {
    return {
      ok: false,
      error: error.message.includes("Guest limit")
        ? "An invitation can have up to 500 guests"
        : "We could not add those guests",
    };
  }

  // Giving a friend their own link means the invitation is now personal. The shared
  // link keeps working: without a friend's code it simply opens with no name on it.
  await supabase.from("invitations").update({ guest_mode: "personalised" }).eq("id", id);

  revalidatePath(`/dashboard/${id}/guests`);
  return { ok: true, message: `${names.length} friend${names.length === 1 ? "" : "s"} added` };
}

export async function removeGuest(invitationId: string, guestId: string): Promise<ActionResult> {
  if (!uuid.safeParse(invitationId).success || !uuid.safeParse(guestId).success) {
    return { ok: false, error: "Guest not found" };
  }
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in again" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("guests")
    .delete()
    .eq("id", guestId)
    .eq("invitation_id", invitationId);
  if (error) return { ok: false, error: "We could not remove that guest" };

  revalidatePath(`/dashboard/${invitationId}/guests`);
  return { ok: true };
}
