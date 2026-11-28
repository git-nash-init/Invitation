import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { verifyAssetToken } from "@/lib/asset-token";
import { clientIp, rateLimit } from "@/lib/security";
import { withBrandFooter } from "@/lib/template-footer";

// Template files live outside /public, so they are only reachable through this route.
const ROOT = path.join(process.cwd(), "private-templates");
const SHARED = new Set(["_platform", "_moments", "symbols", "music"]);

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".ico": "image/x-icon",
};

const forbidden = () => new Response("Forbidden", { status: 403, headers: { "Cache-Control": "no-store" } });
const notFound = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request, ctx: RouteContext<"/t/[...path]">) {
  // A single page load fetches many files, so the cap is generous; it only stops scanning.
  if (!rateLimit(`t:${clientIp(request)}`, 1500, 60_000)) {
    return new Response("Too many requests", { status: 429, headers: { "Retry-After": "30" } });
  }

  const { path: segments } = await ctx.params;
  const [token, first, ...rest] = segments;
  if (!token || !first) return notFound();

  const grant = verifyAssetToken(token);
  if (!grant) return forbidden();
  // A token opens exactly one template, plus the shared folders every template uses.
  if (first !== grant.slug && !SHARED.has(first)) return forbidden();

  let parts: string[];
  try {
    parts = [first, ...rest].map(decodeURIComponent);
  } catch {
    return notFound();
  }
  if (parts.some((p) => p === ".." || p.includes("/") || p.includes("\\") || p.includes("\0") || p.includes(":"))) {
    return forbidden();
  }

  let file = path.resolve(ROOT, ...parts);
  if (!file.startsWith(ROOT + path.sep)) return forbidden();

  // The path is checked above to stay inside private-templates, which next.config.ts
  // includes in the bundle on purpose, so the build must not trace the whole project.
  let stat = await fs.promises.stat(/* turbopackIgnore: true */ file).catch(() => null);
  if (stat?.isDirectory()) {
    file = path.join(file, "index.html");
    stat = await fs.promises.stat(/* turbopackIgnore: true */ file).catch(() => null);
  }
  if (!stat || !stat.isFile()) return notFound();

  const type = TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream";
  const headers: Record<string, string> = {
    "Content-Type": type,
    "Accept-Ranges": "bytes",
    // Private: shared caches and CDNs must not keep copies of paid templates. The address carries a token that
    // stays the same for hours (see mintAssetToken), so a guest's browser can keep the files between visits.
    "Cache-Control": path.extname(file).toLowerCase() === ".html" ? "private, max-age=300" : "private, max-age=3600, stale-while-revalidate=86400",
    "X-Robots-Tag": "noindex, nofollow",
    "Cross-Origin-Resource-Policy": "same-origin",
  };

  // Video and audio need byte ranges to start playing and to seek.
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") ?? "");
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : stat.size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : stat.size - 1;
    start = Math.max(0, start);
    end = Math.min(end, stat.size - 1);
    if (start > end || start >= stat.size) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${stat.size}` } });
    }
    const body = Readable.toWeb(fs.createReadStream(/* turbopackIgnore: true */ file, { start, end })) as ReadableStream;
    return new Response(body, {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${stat.size}`, "Content-Length": String(end - start + 1) },
    });
  }

  // A template's own page gets our credit added at the foot (see template-footer.ts).
  if (path.basename(file) === "index.html" && !SHARED.has(parts[0])) {
    const html = await fs.promises.readFile(/* turbopackIgnore: true */ file, "utf8");
    const editing = new URL(request.url).searchParams.has("edit");
    const out = Buffer.from(withBrandFooter(html, editing), "utf8");
    return new Response(new Uint8Array(out), { status: 200, headers: { ...headers, "Content-Length": String(out.length) } });
  }

  const body = Readable.toWeb(fs.createReadStream(/* turbopackIgnore: true */ file)) as ReadableStream;
  return new Response(body, { status: 200, headers: { ...headers, "Content-Length": String(stat.size) } });
}
