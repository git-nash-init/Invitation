// Uploads previews-out/<slug>/* to the public `previews` bucket and registers them in
// template_media, so the bot and the site can use them. It signs in as YOU (an admin)
// with the site's publishable key; admin-only row level security allows the writes.
// No master key is involved.
//
// Run:
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=... \
//   node --env-file=.env.local scripts/upload-previews.mjs [slug ...]
//
// Files are named with a version stamp (preview-202611191530.mp4) so Telegram, which
// remembers each file it has seen by name, never shows an old copy after you re-upload.
import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!url || !key || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (from .env.local), ADMIN_EMAIL and ADMIN_PASSWORD.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const { error: authError } = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
if (authError) {
  console.error("Could not sign in:", authError.message);
  process.exit(1);
}
const { data: isAdmin } = await supabase.rpc("is_admin");
if (!isAdmin) {
  console.error("That account is not an admin. Add it to public.admins first (see docs/production-guide.md, step 7).");
  process.exit(1);
}

const root = path.resolve("previews-out");
const slugs = process.argv.slice(2).length ? process.argv.slice(2) : (await fs.readdir(root, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 12);

async function put(slug, file, name, contentType) {
  const dest = `${slug}/${name}`;
  const body = await fs.readFile(path.join(root, slug, file));
  const { error } = await supabase.storage.from("previews").upload(dest, body, { contentType, cacheControl: "31536000", upsert: false });
  if (error) throw new Error(`${dest}: ${error.message}`);
  return dest;
}

for (const slug of slugs) {
  const manifest = JSON.parse(await fs.readFile(path.join(root, slug, "manifest.json"), "utf8"));
  const rows = [];
  rows.push({ template_slug: slug, kind: "video", storage_path: await put(slug, manifest.video, `preview-${stamp}.mp4`, "video/mp4"), sort: 0 });
  for (const [i, still] of manifest.stills.entries()) {
    rows.push({ template_slug: slug, kind: "still", storage_path: await put(slug, still, `still-${i + 1}-${stamp}.webp`, "image/webp"), sort: i + 1 });
  }
  // Replace the old registrations for this template with the new ones.
  const del = await supabase.from("template_media").delete().eq("template_slug", slug);
  if (del.error) throw new Error(`${slug}: ${del.error.message}`);
  const ins = await supabase.from("template_media").insert(rows);
  if (ins.error) throw new Error(`${slug}: ${ins.error.message}`);
  console.log(`${slug}: uploaded ${rows.length} files`);
}
