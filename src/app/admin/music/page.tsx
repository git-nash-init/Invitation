import type { Metadata } from "next";
import Link from "next/link";
import { Flash } from "@/components/admin/flash";
import { MusicUploader } from "@/components/admin/music-uploader";
import { SubmitButton } from "@/components/ui/submit-button";
import { createClient } from "@/lib/supabase/server";
import { saveTrack } from "../actions";

export const metadata: Metadata = { title: "Music" };

type Track = {
  id: string;
  title: string;
  category_slugs: string[] | null;
  storage_path: string;
  is_active: boolean;
};

export default async function MusicPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; e?: string; cat?: string }>;
}) {
  const { ok, e, cat } = await searchParams;
  const supabase = await createClient();
  const [{ data: categories }, { data: tracks }] = await Promise.all([
    supabase.from("music_categories").select("slug, name").order("sort"),
    supabase.from("music_tracks").select("id, title, category_slugs, storage_path, is_active").order("sort"),
  ]);
  const cats = categories ?? [];
  const all = (tracks ?? []) as Track[];
  const current = cats.find((c) => c.slug === cat) ?? null;
  const shown = current ? all.filter((t) => (t.category_slugs ?? []).includes(current.slug)) : all;
  const countFor = (slug: string) => all.filter((t) => (t.category_slugs ?? []).includes(slug)).length;

  const tab = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
      active ? "bg-[#9f1239] text-[#fff4e2]" : "bg-[#fff4e2] text-[#6b0f2b] ring-1 ring-[rgba(159,18,57,0.25)]"
    }`;

  return (
    <>
      <h1 className="display text-[32px] leading-[1.15] sm:text-[36px]">Music</h1>
      <p className="mt-2 max-w-[42rem] text-[14px] leading-5 text-text-2">
        Upload tracks into a category, then tick every category a track belongs to. A track switched on here is offered to
        hosts under those categories.
      </p>
      <Flash ok={ok} e={e} />
      <MusicUploader categories={cats} />

      <nav aria-label="Music categories" className="mt-6 flex flex-wrap gap-2">
        <Link href="/admin/music" className={tab(!current)} aria-current={!current ? "page" : undefined}>
          All ({all.length})
        </Link>
        {cats.map((c) => (
          <Link
            key={c.slug}
            href={`/admin/music?cat=${c.slug}`}
            className={tab(current?.slug === c.slug)}
            aria-current={current?.slug === c.slug ? "page" : undefined}
          >
            {c.name} ({countFor(c.slug)})
          </Link>
        ))}
      </nav>

      <div className="mt-6 grid gap-4">
        {shown.length === 0 && (
          <p className="text-[14px] text-text-2">No tracks in this category yet. Upload some above.</p>
        )}
        {shown.map((t) => (
          <form key={t.id} action={saveTrack} className="glass grid gap-3 rounded-[16px] p-5">
            <input type="hidden" name="id" value={t.id} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="min-w-0 truncate text-[15px] font-semibold">{t.title}</p>
              <label className="flex items-center gap-3 text-[14px]">
                <input type="checkbox" name="is_active" defaultChecked={t.is_active} className="size-5 accent-[#f5a300]" />
                On for hosts
              </label>
            </div>
            <fieldset className="grid gap-2 sm:grid-cols-2">
              <legend className="label">Categories</legend>
              {cats.map((c) => (
                <label key={c.slug} className="flex items-center gap-2.5 text-[14px]">
                  <input
                    type="checkbox"
                    name="category"
                    value={c.slug}
                    defaultChecked={(t.category_slugs ?? []).includes(c.slug)}
                    className="size-4 accent-[#f5a300]"
                  />
                  {c.name}
                </label>
              ))}
            </fieldset>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="min-w-0 truncate text-[12px] text-text-2">{t.storage_path}</span>
              <SubmitButton pendingText="Saving" className="w-full sm:w-auto">Save</SubmitButton>
            </div>
          </form>
        ))}
      </div>
    </>
  );
}
