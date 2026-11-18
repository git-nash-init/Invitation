import { createClient } from "@/lib/supabase/server";

export type Template = {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  highlights: string;
  cover_path: string;
};

export async function getTemplates(): Promise<Template[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("templates")
    .select("slug, name, tagline, category, highlights, cover_path")
    .order("sort", { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function getTemplate(slug: string): Promise<Template | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("templates")
    .select("slug, name, tagline, category, highlights, cover_path")
    .eq("slug", slug)
    .maybeSingle();
  return data ?? null;
}
