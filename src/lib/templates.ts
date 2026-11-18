import { createClient } from "@/lib/supabase/server";

export type Template = {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  highlights: string;
  cover_path: string;
  price: number;
  bullets: string[];
  category_slug: string | null;
};

const COLUMNS = "slug, name, tagline, category, highlights, cover_path, price, bullets, category_slug";

export async function getTemplates(): Promise<Template[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("templates")
    .select(COLUMNS)
    .order("sort", { ascending: true });
  if (error) return [];
  return (data ?? []) as Template[];
}

export async function getTemplate(slug: string): Promise<Template | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("templates").select(COLUMNS).eq("slug", slug).maybeSingle();
  return (data as Template | null) ?? null;
}

/** Does the signed-in user hold an unused paid credit for this template? */
export async function hasCredit(slug: string): Promise<boolean> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("entitlements")
    .select("id", { count: "exact", head: true })
    .eq("template_slug", slug)
    .eq("revoked", false)
    .is("consumed_at", null);
  return (count ?? 0) > 0;
}
