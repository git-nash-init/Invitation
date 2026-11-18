import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Template files are not public. A page that has already checked who may see a
 * template (the owner's studio, a published invitation, a private demo) puts a
 * short-lived signed token in the iframe address: /t/<token>/<template>/...
 * Relative paths inside the template keep that prefix, so no cookie is needed.
 */
function secret(): string {
  const s = process.env.ASSET_TOKEN_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV !== "production") return "dev-only-asset-secret-do-not-use-in-production";
  throw new Error("ASSET_TOKEN_SECRET must be set (at least 32 characters)");
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export function mintAssetToken(templateSlug: string, ttlSeconds: number): string {
  const exp = Math.floor(Date.now() / 1000) + Math.max(30, Math.floor(ttlSeconds));
  const payload = `${templateSlug}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyAssetToken(token: string): { slug: string } | null {
  const m = /^([a-z0-9-]{2,40})\.(\d{10})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!m) return null;
  const [, slug, exp, sig] = m;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return null;
  const want = Buffer.from(sign(`${slug}.${exp}`));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  return { slug };
}
