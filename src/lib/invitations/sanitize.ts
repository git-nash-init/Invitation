/**
 * Invitation configs are authored by users and rendered by legacy templates
 * that insert many strings with innerHTML. Everything is therefore sanitised
 * on the server before it is stored: markup characters are removed, quotes are
 * normalised so attribute breakouts are impossible, and URL-like fields must
 * be on an allow-list.
 */

const MAX_DEPTH = 8;
const MAX_ARRAY = 300;
const MAX_KEYS = 120;
const MAX_STRING = 2000;
const KEY_RE = /^[A-Za-z0-9_.\- ]{1,48}$/;
const BLOCKED_KEYS = new Set(["__proto__", "constructor", "prototype"]);

// Keys that hold a link guests can tap (any https URL is fine).
const LINK_KEY_RE = /(^|[a-z])(mapUrl|instagramUrl|url|href|link)$/i;
// Keys that hold a file the page loads (images, audio, video).
const FILE_KEY_RE = /(^|[a-z])(src|image|photo|art|poster|video|audio|cover|background|bg)$/i;

function supabaseOrigin() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return "";
  }
}

/** Plain text: no markup characters, no control characters, normalised quotes. */
export function cleanText(value: string, max = MAX_STRING): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[<>]/g, "")
    .replace(/"/g, "”")
    .replace(/'/g, "’")
    .replace(/`/g, "’")
    .slice(0, max);
}

function isSafeRelativePath(v: string) {
  // template-relative asset paths such as media/x.webp or ../symbols/_ganesha.svg
  if (v.includes(":") || v.startsWith("/") || v.includes("\\")) return false;
  if (v.split("/").some((seg) => seg === "..") && !/^(\.\.\/)(symbols|music|_platform)\//.test(v)) {
    return false;
  }
  return /^[A-Za-z0-9_\-./% ]+$/.test(v);
}

function safeLink(v: string): string {
  if (v === "") return "";
  try {
    const u = new URL(v);
    if (u.protocol === "https:" || u.protocol === "http:") return u.toString().slice(0, 500);
  } catch {
    /* fall through */
  }
  return "";
}

function safeFile(v: string): string {
  if (v === "") return "";
  if (isSafeRelativePath(v)) return v;
  // Absolute paths into the bundled templates folder.
  if (/^\/templates\/[A-Za-z0-9_\-./% ]+$/.test(v) && !v.includes("..")) return v;
  const origin = supabaseOrigin();
  try {
    const u = new URL(v);
    // A host's own uploads, and the tracks and pictures of our own library.
    const ours = ["invite-media", "music"].some((b) => u.pathname.startsWith(`/storage/v1/object/public/${b}/`));
    if (origin && u.origin === origin && ours) {
      return u.toString().slice(0, 500);
    }
  } catch {
    /* fall through */
  }
  return "";
}

function walk(value: unknown, key: string, depth: number): unknown {
  if (depth > MAX_DEPTH) return null;

  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  if (typeof value === "string") {
    if (LINK_KEY_RE.test(key)) return safeLink(value.trim());
    if (FILE_KEY_RE.test(key)) return safeFile(value.trim());
    return cleanText(value);
  }

  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY).map((item) => walk(item, key, depth + 1));
  }

  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    let n = 0;
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (BLOCKED_KEYS.has(k) || !KEY_RE.test(k)) continue;
      if (++n > MAX_KEYS) break;
      if (v === undefined || typeof v === "function") continue;
      out[k] = walk(v, k, depth + 1);
    }
    return out;
  }

  return null;
}

export function sanitizeConfig(input: unknown): Record<string, unknown> | null {
  if (input === null || typeof input !== "object" || Array.isArray(input)) return null;
  const out = walk(input, "", 0) as Record<string, unknown>;
  // Size guard before the database check constraint does it.
  if (JSON.stringify(out).length > 240_000) return null;
  return out;
}
