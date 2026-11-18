// Database access over a direct Postgres connection (the private `bot` schema
// plus the catalogue and purchase tables in `public`).
import postgres from 'npm:postgres@3.4.5';
import { now } from './util.js';

let shared = null;

// One connection pool per function instance, reused across requests.
export function makeEnv(raw = Deno.env.toObject()) {
  if (shared) return shared;
  const sql = postgres(raw.SUPABASE_DB_URL, {
    max: 3,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false, // safe behind the connection pooler
    types: {
      // Counts and sums come back as numbers, not strings.
      bigint: { to: 20, from: [20], parse: Number, serialize: (x) => String(x) },
      numeric: { to: 1700, from: [1700], parse: Number, serialize: (x) => String(x) },
    },
  });
  shared = { ...raw, sql };
  return shared;
}

// ---------- settings ----------
export async function getSetting(env, key, fallback = null) {
  const [r] = await env.sql`select value from bot.settings where key = ${key}`;
  return r ? r.value : fallback;
}
export const setSetting = (env, key, value) =>
  env.sql`insert into bot.settings (key, value) values (${key}, ${env.sql.json(value)})
          on conflict (key) do update set value = excluded.value`;

export const delSetting = (env, key) => env.sql`delete from bot.settings where key = ${key}`;

// ---------- users ----------
export async function getUser(env, id) {
  const [r] = await env.sql`select * from bot.users where id = ${id}`;
  return r || null;
}

export async function touchUser(env, from) {
  await env.sql`insert into bot.users (id, first_name, username, started_at)
                values (${from.id}, ${from.first_name || ''}, ${from.username || ''}, ${now()})
                on conflict (id) do nothing`;
  return getUser(env, from.id);
}

// ---------- catalogue ----------
export const listCategories = (env) =>
  env.sql`select slug, name, emoji, blurb from public.categories where is_active order by sort, slug`;

export const listTemplates = (env, categorySlug) =>
  env.sql`select slug, name, tagline, price, bullets, category_slug, cover_path
          from public.templates
          where is_active and category_slug = ${categorySlug}
          order by sort, slug`;

export async function getTemplate(env, slug) {
  const [r] = await env.sql`select slug, name, tagline, price, bullets, category_slug, cover_path, is_active
                            from public.templates where slug = ${slug}`;
  return r || null;
}

export const templateMedia = (env, slug) =>
  env.sql`select kind, storage_path from public.template_media where template_slug = ${slug} order by sort, created_at`;

// At most three tracks that suit this category, in a stable order.
export const tracksFor = (env, categorySlug) =>
  env.sql`select id, title, vibe, storage_path from public.music_tracks
          where is_active and ${categorySlug} = any (category_slugs)
          order by sort, id limit 3`;

export const publicUrl = (env, bucket, path) =>
  `${String(env.SUPABASE_URL).replace(/\/+$/, '')}/storage/v1/object/public/${bucket}/${path}`;

// Telegram file ids: a file is uploaded to Telegram once, then reused.
export async function cachedFileId(env, path) {
  const [r] = await env.sql`select file_id from bot.media_cache where path = ${path}`;
  return r ? r.file_id : null;
}
export const rememberFileId = (env, path, fileId) =>
  env.sql`insert into bot.media_cache (path, file_id, updated_at) values (${path}, ${fileId}, ${now()})
          on conflict (path) do update set file_id = excluded.file_id, updated_at = excluded.updated_at`;

// ---------- payments ----------
export async function getUpi(env, id) {
  const [r] = await env.sql`select * from bot.upi_accounts where id = ${id}`;
  return r || null;
}
export const listUpis = (env) => env.sql`select * from bot.upi_accounts order by sort, id`;

export const defaultGrowth = () => ({ unpaid_on: false });
export const getGrowth = async (env) => ({ ...defaultGrowth(), ...((await getSetting(env, 'growth', {})) || {}) });
