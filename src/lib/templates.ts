import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Template = {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  highlights: string;
  cover_path: string;
  bullets: string[];
  category_slug: string | null;
};

// The price is deliberately not part of the public template: it must never reach the browser
// except on the publish page, where it is shown.
const COLUMNS = "slug, name, tagline, category, highlights, cover_path, bullets, category_slug";

// cache(): a page that asks for the same thing twice (for example its metadata and its body) pays once.
export const getTemplates = cache(async (): Promise<Template[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("templates")
    .select(COLUMNS)
    .order("sort", { ascending: true });
  if (error) return [];
  return (data ?? []) as Template[];
});

export const getTemplate = cache(async (slug: string): Promise<Template | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("templates").select(COLUMNS).eq("slug", slug).maybeSingle();
  return (data as Template | null) ?? null;
});

export type PricedTemplate = Template & { price: number; list_price: number | null };

/** For the publish page only: the template with its price. */
export async function getPricedTemplate(slug: string): Promise<PricedTemplate | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("templates")
    .select(`${COLUMNS}, price, list_price`)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return (data as PricedTemplate | null) ?? null;
}
