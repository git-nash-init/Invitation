"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { cleanText } from "@/lib/invitations/sanitize";

const back = (path: string, message?: string, ok = false): never =>
  redirect(message ? `${path}?${ok ? "ok" : "e"}=${encodeURIComponent(message)}` : path);

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const flag = (f: FormData, k: string) => f.get(k) === "on";

// ---------- connect the Telegram bot ----------
export async function connectBot() {
  await requireAdmin();
  const supabase = await createClient();
  // A single-use token proves an admin pressed the button; the function checks it in the database.
  const { data: token, error } = await supabase.rpc("admin_setup_token");
  if (error || typeof token !== "string") back("/admin/setup", "Could not start the connection.");

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  let body: { ok?: boolean; bot?: string; error?: string } | null = null;
  try {
    const res = await fetch(`${base}/functions/v1/telegram-bot/setup`, {
      method: "POST",
      headers: { "x-setup-token": String(token) },
      cache: "no-store",
    });
    body = await res.json().catch(() => null);
  } catch {
    body = null;
  }
  if (!body?.ok) {
    back("/admin/setup", body?.error ?? "The bot function did not answer. Check that it is deployed and the BOT_TOKEN secret is set.");
  }
  back("/admin/setup", `Connected to @${body?.bot ?? "your bot"}. Send /start to it to try.`, true);
}

// ---------- payments (UPI IDs) ----------
export async function saveUpi(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_upi_save", {
    p_id: id ? Number(id) : null,
    p_label: str(formData, "label"),
    p_vpa: str(formData, "vpa"),
    p_payee_name: str(formData, "payee_name"),
    p_active: flag(formData, "active"),
    p_daily_limit: Number(str(formData, "daily_limit")) || 0,
  });
  if (error) back("/admin/payments", "Could not save the UPI ID.");
  const res = data as { ok: boolean; error?: string };
  revalidatePath("/admin/payments");
  if (!res.ok) back("/admin/payments", res.error ?? "Could not save the UPI ID.");
  back("/admin/payments", "Saved", true);
}

export async function deleteUpi(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_upi_delete", { p_id: Number(str(formData, "id")) });
  const res = (data ?? { ok: false }) as { ok: boolean; error?: string };
  revalidatePath("/admin/payments");
  if (!res.ok) back("/admin/payments", res.error ?? "Could not delete it.");
  back("/admin/payments", "Deleted", true);
}

// ---------- templates and categories ----------
const templateSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{2,40}$/),
  name: z.string().trim().min(1).max(80),
  price: z.coerce.number().int().min(1).max(100000),
  category_slug: z.string().regex(/^[a-z0-9-]{2,40}$/).or(z.literal("")),
});

export async function saveTemplate(formData: FormData) {
  await requireAdmin();
  const parsed = templateSchema.safeParse({
    slug: str(formData, "slug"),
    name: str(formData, "name"),
    price: str(formData, "price"),
    category_slug: str(formData, "category_slug"),
  });
  if (!parsed.success) back("/admin/templates", "Check the name and price (₹1 to ₹1,00,000).");
  const d = parsed.success ? parsed.data : null;
  if (!d) return;

  const bullets = str(formData, "bullets")
    .split(/\r?\n/)
    .map((b) => cleanText(b.trim(), 80))
    .filter(Boolean)
    .slice(0, 3);

  const supabase = await createClient();
  const { error } = await supabase
    .from("templates")
    .update({
      name: cleanText(d.name, 80),
      price: d.price,
      category_slug: d.category_slug || null,
      is_active: flag(formData, "is_active"),
      bullets,
    })
    .eq("slug", d.slug);
  revalidatePath("/admin/templates");
  if (error) back("/admin/templates", "Could not save that template.");
  back("/admin/templates", "Saved", true);
}

const categorySchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{2,40}$/, "Use lowercase letters, numbers and dashes for the code."),
  name: z.string().trim().min(1).max(60),
  emoji: z.string().trim().max(8),
  blurb: z.string().trim().max(120),
  sort: z.coerce.number().int().min(0).max(1000),
});

export async function saveCategory(formData: FormData) {
  await requireAdmin();
  const parsed = categorySchema.safeParse({
    slug: str(formData, "slug"),
    name: str(formData, "name"),
    emoji: str(formData, "emoji"),
    blurb: str(formData, "blurb"),
    sort: str(formData, "sort") || "0",
  });
  if (!parsed.success) back("/admin/templates", parsed.error.issues[0]?.message ?? "Check the category.");
  if (!parsed.success) return;

  const supabase = await createClient();
  const { error } = await supabase.from("categories").upsert({
    ...parsed.data,
    name: cleanText(parsed.data.name, 60),
    blurb: cleanText(parsed.data.blurb, 120),
    is_active: flag(formData, "is_active"),
  });
  revalidatePath("/admin/templates");
  if (error) back("/admin/templates", "Could not save that category.");
  back("/admin/templates", "Category saved", true);
}

// ---------- music ----------
const trackSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{2,60}$/, "Use lowercase letters, numbers and dashes for the code."),
  title: z.string().trim().min(1).max(80),
  vibe: z.string().trim().max(120),
  storage_path: z.string().trim().min(3).max(200),
  source: z.enum(["original", "pixabay", "flow-music", "owned", "other"]),
  license_url: z.string().trim().max(300),
  license_note: z.string().trim().max(400),
});

export async function saveTrack(formData: FormData) {
  await requireAdmin();
  const parsed = trackSchema.safeParse({
    id: str(formData, "id"),
    title: str(formData, "title"),
    vibe: str(formData, "vibe"),
    storage_path: str(formData, "storage_path"),
    source: str(formData, "source"),
    license_url: str(formData, "license_url"),
    license_note: str(formData, "license_note"),
  });
  if (!parsed.success) back("/admin/music", parsed.error.issues[0]?.message ?? "Check the track details.");
  if (!parsed.success) return;

  const categories = str(formData, "category_slugs")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[a-z0-9-]{2,40}$/.test(s));

  const supabase = await createClient();
  const { error } = await supabase.from("music_tracks").upsert({
    ...parsed.data,
    title: cleanText(parsed.data.title, 80),
    vibe: cleanText(parsed.data.vibe, 120),
    category_slugs: categories,
    is_active: flag(formData, "is_active"),
  });
  revalidatePath("/admin/music");
  if (error) {
    // The database refuses an active track with no licence source written down.
    back("/admin/music", error.message.includes("music_license_documented") ? "Write down the licence link or a licence note before turning a track on." : "Could not save that track.");
  }
  back("/admin/music", "Track saved", true);
}
