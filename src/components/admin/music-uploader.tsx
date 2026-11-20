"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { registerTrack } from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 15 * 1024 * 1024; // the music bucket's limit

/** "Aaoge Jab Tum Flute.mp3" -> { id: "aaoge-jab-tum-flute", title: "Aaoge Jab Tum Flute" } */
function describe(file: File) {
  const base = file.name.replace(/\.[^.]+$/, "").replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
  const id = base.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  return { id: id.length >= 2 ? id : `track-${Date.now().toString(36)}`, title: base.slice(0, 80) || "Untitled" };
}

type Line = { name: string; state: "waiting" | "uploading" | "done" | "error"; note?: string };

/** Puts audio files into the music bucket, as the signed-in admin, and lists each one in the library. */
export function MusicUploader() {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>([]);
  const [licence, setLicence] = useState("Added by the site owner. Licence document not attached yet.");
  const [busy, setBusy] = useState(false);

  async function run(files: File[]) {
    const supabase = createClient();
    setBusy(true);
    setLines(files.map((f) => ({ name: f.name, state: "waiting" })));
    const set = (i: number, patch: Partial<Line>) => setLines((cur) => cur.map((l, k) => (k === i ? { ...l, ...patch } : l)));

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const type = /\.m4a$/i.test(f.name) ? "audio/mp4" : "audio/mpeg";
      if (!/\.(mp3|m4a)$/i.test(f.name)) { set(i, { state: "error", note: "Only MP3 or M4A files" }); continue; }
      if (f.size > MAX_BYTES) { set(i, { state: "error", note: "Over 15 MB" }); continue; }
      set(i, { state: "uploading" });
      const { id, title } = describe(f);
      const path = `${id}.${/\.m4a$/i.test(f.name) ? "m4a" : "mp3"}`;
      const up = await supabase.storage.from("music").upload(path, f, { contentType: type, upsert: true, cacheControl: "31536000" });
      if (up.error) { set(i, { state: "error", note: `Upload refused: ${up.error.message}` }); continue; }
      const res = await registerTrack({ id, title, storage_path: path, license_note: licence });
      set(i, res.ok ? { state: "done" } : { state: "error", note: res.error });
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <section className="glass mt-6 grid gap-3 rounded-[16px] p-5" aria-labelledby="bulk-h">
      <h2 id="bulk-h" className="text-[16px] font-semibold leading-6">Add tracks from your computer</h2>
      <p className="text-[14px] leading-5 text-text-2">
        Pick one or many MP3 or M4A files (up to 15 MB each). Each is uploaded, named after its file and switched on, so
        hosts can listen to it and choose it. Rename or switch off any track below.
      </p>
      <div>
        <label className="label" htmlFor="bulk-licence">Licence note recorded for these files</label>
        <input id="bulk-licence" className="field" value={licence} onChange={(e) => setLicence(e.target.value)} maxLength={300} />
      </div>
      <div>
        <input
          id="bulk-files"
          type="file"
          multiple
          accept=".mp3,.m4a,audio/mpeg,audio/mp4"
          disabled={busy || licence.trim().length < 3}
          onChange={(e) => { const fs = Array.from(e.target.files ?? []); e.target.value = ""; if (fs.length) void run(fs); }}
          className="sr-only"
        />
        <Button type="button" disabled={busy || licence.trim().length < 3} onClick={() => document.getElementById("bulk-files")?.click()}>
          <Upload size={18} strokeWidth={1.75} aria-hidden="true" />
          {busy ? "Uploading" : "Choose audio files"}
        </Button>
      </div>
      {lines.length > 0 && (
        <ul className="grid gap-1 text-[14px]" aria-live="polite">
          {lines.map((l) => (
            <li key={l.name} className="flex items-center justify-between gap-3">
              <span className="truncate">{l.name}</span>
              <span className={l.state === "error" ? "text-negative" : l.state === "done" ? "text-positive" : "text-muted"}>
                {l.state === "waiting" ? "Waiting" : l.state === "uploading" ? "Uploading" : l.state === "done" ? "Added" : l.note}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
