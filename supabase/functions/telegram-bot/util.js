// Small shared helpers. All timestamps are unix seconds.
export const now = () => Math.floor(Date.now() / 1000);

// India time: "today" starts at midnight IST, not UTC.
const IST = 19800;
export const dayStart = (t = now()) => Math.floor((t + IST) / 86400) * 86400 - IST;

export const rupees = (paise) => (paise / 100).toFixed(2);

export function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

export function safeEqual(a, b) {
  a = String(a);
  b = String(b);
  let diff = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export function hex(buf) {
  return [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

export function randHex(bytes = 16) {
  return hex(crypto.getRandomValues(new Uint8Array(bytes)));
}

export function randInt(min, max) {
  const r = crypto.getRandomValues(new Uint32Array(1))[0];
  return min + (r % (max - min + 1));
}

// URL-safe random token. 24 bytes = 192 bits, far beyond guessing.
export function randToken(bytes = 24) {
  const b = crypto.getRandomValues(new Uint8Array(bytes));
  let s = '';
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// The database stores only this hash of a token, never the token itself.
export async function sha256Hex(s) {
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(s))));
}

const SECRET_NAMES = ['BOT_TOKEN', 'GEMINI_KEY', 'WEBHOOK_SECRET', 'CRON_SECRET', 'SUPABASE_DB_URL'];
export function redact(s, env) {
  s = String(s ?? '');
  for (const n of SECRET_NAMES) if (env && env[n]) s = s.split(env[n]).join('***');
  return s;
}
export const errMsg = (e, env) => redact((e && e.message) || e, env);

export function adminIds(env) {
  return String(env.ADMIN_IDS || '')
    .split(',')
    .map((x) => Number(x.trim()))
    .filter((x) => x > 0);
}
export const isAdminUser = (env, uid) => adminIds(env).includes(uid);

export const text = (body, status = 200) =>
  new Response(body, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } });
export const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
