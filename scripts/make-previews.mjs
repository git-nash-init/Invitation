// Makes the preview media for each template and writes it to public/previews/<slug>/:
//   preview.mp4          sharp 2x phone-sized walkthrough with a "preview" watermark
//   cover.webp           clean opening frame used on cards and the hero
//   still-1..3.webp      watermarked stills
//   manifest.json
// Everything written here is safe to publish: it is watermarked and only shows what a
// visitor sees in the public demo anyway.
// It drives your installed Chrome through the real template (via a short-lived
// signed link) and encodes with ffmpeg. Nothing here is uploaded: see upload-previews.mjs.
//
// Run:  node scripts/make-previews.mjs [slug ...]
// It serves private-templates/ itself on a free local port (no site, no secrets needed),
// so it never touches the running site or its signing key.
import http from "node:http";
import { createReadStream, statSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const run = promisify(execFile);

const TEMPLATES = path.resolve("private-templates");
const CHROME =
  process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const FONT = process.env.WATERMARK_FONT ?? "C\\:/Windows/Fonts/arialbd.ttf"; // ffmpeg filter escaping
const MARK = process.env.WATERMARK_TEXT ?? "Pratham Invitation preview";
const OUT = path.resolve("public/previews");

// Which still becomes the clean cover (1-based). The two papercut designs share their
// opening scenes and Royale shares a mandap look with Noor, so they use frames that differ.
const COVER_FROM = { royale: 1, papercut: 1, "papercut-magenta": 3 };
const ALL = ["royale", "noor", "rose-invitation", "papercut-magenta", "papercut"];
const slugs = process.argv.slice(2).length ? process.argv.slice(2) : ALL;

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".mp4": "video/mp4", ".mp3": "audio/mpeg", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf",
};

// Minimal static server with Range support, mirroring what /t/<token>/... does on the site.
const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url ?? "/", "http://x");
    let rel = decodeURIComponent(url.pathname).replace(/^\/t\/[^/]+\//, "");
    let file = path.resolve(TEMPLATES, rel);
    if (!file.startsWith(TEMPLATES + path.sep)) { res.writeHead(403).end(); return; }
    let st = statSync(file, { throwIfNoEntry: false });
    if (st?.isDirectory()) { file = path.join(file, "index.html"); st = statSync(file, { throwIfNoEntry: false }); }
    if (!st) { res.writeHead(404).end(); return; }
    const type = MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream";
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? "");
    if (range) {
      const start = range[1] ? Number(range[1]) : 0;
      const end = range[2] ? Math.min(Number(range[2]), st.size - 1) : st.size - 1;
      res.writeHead(206, { "content-type": type, "accept-ranges": "bytes", "content-range": `bytes ${start}-${end}/${st.size}`, "content-length": end - start + 1 });
      createReadStream(file, { start, end }).pipe(res);
    } else {
      res.writeHead(200, { "content-type": type, "accept-ranges": "bytes", "content-length": st.size });
      createReadStream(file).pipe(res);
    }
  } catch { res.writeHead(500).end(); }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${server.address().port}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));


// Two marks: a small corner tag, and a faint diagonal one across the middle.
const watermark = [
  `drawtext=fontfile='${FONT}':text='${MARK}':fontsize=20:fontcolor=white@0.85:borderw=2:bordercolor=black@0.55:x=w-tw-16:y=h-th-18`,
  `drawtext=fontfile='${FONT}':text='${MARK}':fontsize=34:fontcolor=white@0.16:borderw=1:bordercolor=black@0.12:x=(w-tw)/2:y=(h-th)/2`,
].join(",");

async function capture(slug) {
  const dir = path.join(OUT, slug);
  await fs.mkdir(dir, { recursive: true });
  const raw = path.join(dir, "raw.webm");
  const url = `${BASE}/t/local/${slug}/`;

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-first-run", "--autoplay-policy=no-user-gesture-required", "--mute-audio"],
  });
  const stills = [];
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 360, height: 640, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60_000 });
    await sleep(1500);

    const recorder = await page.screencast({ path: raw, speed: 1 });

    // Opening card, then the tap that opens the invitation.
    await sleep(1800);
    stills.push(await shot(page, dir, 1));
    // Prefer a real <button>/<a> that says "tap to open", and click it with a real pointer.
    const handle = await page.evaluateHandle(() => {
      const re = /tap to open/i;
      const pick = (sel) => [...document.querySelectorAll(sel)].find((e) => re.test(e.textContent || ""));
      return pick("button, a, [role=button]") ?? [...document.querySelectorAll("div, span")].reverse().find((e) => re.test(e.textContent || "") && e.children.length < 3) ?? null;
    });
    const el = handle.asElement();
    let tapped = false;
    if (el) { try { await el.click(); tapped = true; } catch {} }
    await sleep(tapped ? 3200 : 800);
    stills.push(await shot(page, dir, 2));

    // A slow scroll through the invitation.
    for (let i = 0; i < 16; i++) {
      await page.mouse.wheel({ deltaY: 420 });
      await sleep(650);
      if (i === 8) stills.push(await shot(page, dir, 3));
    }
    await sleep(600);
    await recorder.stop();
    return { dir, raw, stills, tapped, errors };
  } finally {
    await browser.close();
  }
}

async function shot(page, dir, n) {
  const file = path.join(dir, `raw-still-${n}.png`);
  await page.screenshot({ path: file });
  return file;
}

async function encode({ dir, raw, stills, slug }) {
  const preview = path.join(dir, "preview.mp4");
  // Phone-sized, no sound (the bot and site add music separately), starts instantly in Telegram.
  await run("ffmpeg", [
    "-y", "-loglevel", "error", "-i", raw,
    "-t", "24", "-vf", `fps=30,scale=720:-2:flags=lanczos,${watermark}`,
    "-c:v", "libx264", "-preset", "medium", "-crf", "26", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", "-an", preview,
  ]);
  const outStills = [];
  // Clean cover from the opened invitation (still 2), no watermark, for cards and the hero.
  await run("ffmpeg", ["-y", "-loglevel", "error", "-i", stills[(COVER_FROM[slug] ?? 2) - 1] ?? stills[0], "-vf", "scale=720:-2:flags=lanczos", "-quality", "86", path.join(dir, "cover.webp")]);
  for (const [i, file] of stills.entries()) {
    const out = path.join(dir, `still-${i + 1}.webp`);
    await run("ffmpeg", ["-y", "-loglevel", "error", "-i", file, "-vf", `scale=720:-2:flags=lanczos,${watermark}`, "-quality", "82", out]);
    outStills.push(out);
    await fs.rm(file, { force: true });
  }
  await fs.rm(raw, { force: true });
  return { preview, outStills };
}

for (const slug of slugs) {
  process.stdout.write(`${slug}: capturing... `);
  const cap = await capture(slug);
  process.stdout.write("encoding... ");
  const { preview, outStills } = await encode({ ...cap, slug });
  const { stdout } = await run("ffprobe", [
    "-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=width,height,duration", "-of", "csv=p=0", preview,
  ]);
  const size = (await fs.stat(preview)).size;
  await fs.writeFile(
    path.join(cap.dir, "manifest.json"),
    JSON.stringify({ slug, video: "preview.mp4", cover: "cover.webp", stills: outStills.map((p) => path.basename(p)), probe: stdout.trim(), bytes: size, tapped: cap.tapped, pageErrors: cap.errors }, null, 2),
  );
  console.log(`done  ${stdout.trim()}  ${(size / 1024).toFixed(0)} KB  opened=${cap.tapped}  errors=${cap.errors.length}`);
}
server.close();
