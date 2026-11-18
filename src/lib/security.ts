/** Rejects cross-site POSTs. Combined with SameSite=Lax session cookies this blocks CSRF. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

// Best-effort, per server instance. Production adds a Vercel Firewall rate-limit rule on /api/*.
const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (now > v.reset) buckets.delete(k);
    }
    return true;
  }
  if (b.count >= limit) return false;
  b.count++;
  return true;
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

type Kind = "image" | "audio";

/** File type from the first bytes, never from the client-supplied type or name. */
export function sniffFile(bytes: Uint8Array, kind: Kind): { ext: string; mime: string } | null {
  const b = bytes;
  const ascii = (s: number, e: number) => String.fromCharCode(...b.slice(s, e));

  if (kind === "image") {
    if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
    if (ascii(1, 4) === "PNG" && b[0] === 0x89) return { ext: "png", mime: "image/png" };
    if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { ext: "webp", mime: "image/webp" };
    return null;
  }

  if (ascii(0, 3) === "ID3" || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) {
    return { ext: "mp3", mime: "audio/mpeg" };
  }
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WAVE") return { ext: "wav", mime: "audio/wav" };
  if (ascii(0, 4) === "OggS") return { ext: "ogg", mime: "audio/ogg" };
  if (ascii(4, 8) === "ftyp") return { ext: "m4a", mime: "audio/mp4" };
  return null;
}
