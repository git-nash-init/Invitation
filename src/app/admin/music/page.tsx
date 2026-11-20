import type { Metadata } from "next";
import { Flash } from "@/components/admin/flash";
import { MusicUploader } from "@/components/admin/music-uploader";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { saveTrack } from "../actions";

export const metadata: Metadata = { title: "Music" };

const SOURCES = [
  ["flow-music", "Flow Music"],
  ["original", "Original"],
  ["pixabay", "Pixabay"],
  ["owned", "We own it"],
  ["other", "Other"],
] as const;

export default async function MusicPage({ searchParams }: { searchParams: Promise<{ ok?: string; e?: string }> }) {
  const { ok, e } = await searchParams;
  const supabase = await createClient();
  const { data: tracks } = await supabase
    .from("music_tracks")
    .select("id, title, vibe, category_slugs, storage_path, source, license_url, license_note, is_active")
    .order("sort");

  return (
    <>
      <h1 className="display text-[32px] leading-[1.15] sm:text-[36px]">Music</h1>
      <p className="mt-2 max-w-[42rem] text-[14px] leading-5 text-text-2">
        Every track switched on here is offered to hosts in the invitation editor, where they can listen and choose it. Every live track must record where it came from, so you can always show its licence.
      </p>
      <Flash ok={ok} e={e} />
      <MusicUploader />

      <div className="mt-6 grid gap-4">
        {[...(tracks ?? []), null].map((t) => {
          const k = t?.id ?? "new";
          return (
            <form key={k} action={saveTrack} className="glass grid gap-3 rounded-[16px] p-5 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor={`i-${k}`}>Code</label>
                <input id={`i-${k}`} name="id" className="field" defaultValue={t?.id} readOnly={!!t} placeholder="royal-shehnai-entry" required />
              </div>
              <div>
                <label className="label" htmlFor={`t-${k}`}>Title buyers see</label>
                <input id={`t-${k}`} name="title" className="field" defaultValue={t?.title} required />
              </div>
              <div>
                <label className="label" htmlFor={`v-${k}`}>Feel, in a few words</label>
                <input id={`v-${k}`} name="vibe" className="field" defaultValue={t?.vibe} placeholder="Grand shehnai, joyful" />
              </div>
              <div>
                <label className="label" htmlFor={`cs-${k}`}>Categories (codes, comma separated)</label>
                <input id={`cs-${k}`} name="category_slugs" className="field" defaultValue={t?.category_slugs?.join(", ")} placeholder="royal-palace" />
              </div>
              <div>
                <label className="label" htmlFor={`p-${k}`}>File in the music bucket</label>
                <input id={`p-${k}`} name="storage_path" className="field" defaultValue={t?.storage_path} placeholder="royal-shehnai-entry.mp3" required />
              </div>
              <div>
                <label className="label" htmlFor={`s-${k}`}>Where it came from</label>
                <select id={`s-${k}`} name="source" className="field" defaultValue={t?.source ?? "flow-music"}>
                  {SOURCES.map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor={`lu-${k}`}>Licence or terms link</label>
                <input id={`lu-${k}`} name="license_url" className="field" defaultValue={t?.license_url} placeholder="https://…" />
              </div>
              <div>
                <label className="label" htmlFor={`ln-${k}`}>Licence note (tool, plan, date)</label>
                <input id={`ln-${k}`} name="license_note" className="field" defaultValue={t?.license_note} placeholder="Flow Music, paid plan, terms read 2026-11-20" />
              </div>
              <label className="flex items-center gap-3 text-[14px]">
                <input type="checkbox" name="is_active" defaultChecked={t ? t.is_active : false} className="size-5 accent-[#f5a300]" />
                Offer to buyers
              </label>
              <div className="sm:text-right">
                <Button type="submit" className="w-full sm:w-auto">{t ? "Save" : "Add track"}</Button>
              </div>
            </form>
          );
        })}
      </div>
    </>
  );
}
