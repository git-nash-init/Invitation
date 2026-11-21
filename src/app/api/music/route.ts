import { NextResponse } from "next/server";

/**
 * The tracks a host can pick from in the invitation editor. Public on purpose: it lists only tracks the
 * admin has switched on, and each file is already public in the music bucket. Cached at the edge so the
 * editor never waits on the database for it.
 */
export async function GET() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!base || !key) return NextResponse.json({ tracks: [] }, { status: 503 });

  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const [res, catRes] = await Promise.all([
    fetch(
      `${base}/rest/v1/music_tracks?select=id,title,vibe,storage_path,duration_s,category_slugs&is_active=eq.true&order=sort.asc,title.asc`,
      { headers, next: { revalidate: 300 } },
    ).catch(() => null),
    fetch(`${base}/rest/v1/music_categories?select=slug,name&is_active=eq.true&order=sort.asc`, {
      headers,
      next: { revalidate: 300 },
    }).catch(() => null),
  ]);
  if (!res?.ok || !catRes?.ok) return NextResponse.json({ tracks: [], categories: [] }, { status: 502, headers: { "Cache-Control": "no-store" } });

  const rows = (await res.json()) as {
    id: string;
    title: string;
    vibe: string;
    storage_path: string;
    duration_s: number | null;
    category_slugs: string[] | null;
  }[];
  const categories = (await catRes.json()) as { slug: string; name: string }[];
  const tracks = rows.map((t) => ({
    id: t.id,
    title: t.title,
    vibe: t.vibe,
    seconds: t.duration_s,
    categories: t.category_slugs ?? [],
    url: `${base}/storage/v1/object/public/music/${t.storage_path.split("/").map(encodeURIComponent).join("/")}`,
  }));
  return NextResponse.json(
    { tracks, categories },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=3600" } },
  );
}
