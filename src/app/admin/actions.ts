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

// ---------- templates and categories ----------
const templateSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{2,40}$/),
  name: z.string().trim().min(1).max(80),
  price: z.coerce.number().int().min(1).max(100000),
  list_price: z.coerce.number().int().min(0).max(100000),
  category_slug: z.string().regex(/^[a-z0-9-]{2,40}$/).or(z.literal("")),
});

export async function saveTemplate(formData: FormData) {
  await requireAdmin();
  const parsed = templateSchema.safeParse({
    slug: str(formData, "slug"),
    name: str(formData, "name"),
    price: str(formData, "price"),
    list_price: str(formData, "list_price") || "0",
    category_slug: str(formData, "category_slug"),
  });
  if (!parsed.success) back("/admin/templates", "Check the name and prices (₹1 to ₹1,00,000).");
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
      // A list price only shows (struck through) when it is higher than the price.
      list_price: d.list_price > d.price ? d.list_price : null,
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

// Called by the bulk uploader after the browser has put the file in the music bucket.
const uploadedTrackSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{2,60}$/),
  title: z.string().trim().min(1).max(80),
  storage_path: z.string().trim().min(3).max(200).regex(/^[A-Za-z0-9._-]+$/),
  license_note: z.string().trim().min(3).max(400),
});

export async function registerTrack(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const parsed = uploadedTrackSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the track details." };

  const supabase = await createClient();
  const { data: last } = await supabase.from("music_tracks").select("sort").order("sort", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("music_tracks").upsert({
    id: parsed.data.id,
    title: cleanText(parsed.data.title, 80),
    vibe: "",
    category_slugs: [],
    storage_path: parsed.data.storage_path,
    source: "other",
    license_url: "",
    license_note: cleanText(parsed.data.license_note, 400),
    is_active: true,
    sort: (last?.sort ?? 0) + 1,
  });
  revalidatePath("/admin/music");
  return error ? { ok: false, error: "Could not save that track." } : { ok: true };
}
