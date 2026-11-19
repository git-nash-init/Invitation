// Makes the preview media for each template and writes it to public/previews/<slug>/:
//   preview.mp4          sharp 2x phone-sized walkthrough with a "preview" watermark
//   poster.webp          first frame of the video (so it never jumps when it starts)
//   cover.webp           clean opened-invitation frame used on cards
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

// Every folder in private-templates/ with an index.html is a template (shared folders start with _ or are
// listed in SHARED). A new template is picked up with no edit here.
const SHARED = new Set(["symbols", "music"]);
const ALL = (await fs.readdir(TEMPLATES, { withFileTypes: true }))
  .filter((d) => d.isDirectory() && !d.name.startsWith("_") && !SHARED.has(d.name))
  .filter((d) => statSync(path.join(TEMPLATES, d.name, "index.html"), { throwIfNoEntry: false }))
  .map((d) => d.name)
  .sort();

// Per-template settings. Only add an entry when a template needs it:
//   tap       text of the control that opens the invitation (default matches "Tap to open")
//   openWait  ms to wait after the tap before the "opened" still, so the title animation has finished
//   settle    ms to wait on the opening screen after the page loads, before recording starts
//   coverFrom which still (1-3) becomes the card cover, when the default (2) looks like another design's
const OPTS = {
  noor: { openWait: 5200 },
  royale: { coverFrom: 1 },
  papercut: { coverFrom: 1 },
  "papercut-magenta": { coverFrom: 3 },
};
const opt = (slug, key, dflt) => OPTS[slug]?.[key] ?? dflt;
const args = process.argv.slice(2);
// --video-only re-records just preview.mp4 and leaves the covers and stills as they are.
const VIDEO_ONLY = args.includes("--video-only");
const named = args.filter((a) => !a.startsWith("--"));
const slugs = named.length ? named : ALL;

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

async function openPage(browser, url, errors) {
  const page = await browser.newPage();
  await page.setViewport({ width: 360, height: 640, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60_000 });
  await sleep(1500);
  return page;
}

// Finds the "Tap to open" control and presses it with a real pointer.
async function tapToOpen(page, tapSrc = "tap to open") {
  const handle = await page.evaluateHandle((tapSrc) => {
    const re = new RegExp(tapSrc, "i");
    const pick = (sel) => [...document.querySelectorAll(sel)].find((e) => re.test(e.textContent || ""));
    return pick("button, a, [role=button]") ?? [...document.querySelectorAll("div, span")].reverse().find((e) => re.test(e.textContent || "") && e.children.length < 3) ?? null;
  }, tapSrc);
  const el = handle.asElement();
  if (!el) return false;
  try { await el.click(); return true; } catch { return false; }
}

// Stills come from their own page load. Taking a screenshot while the screencast is
// running makes Chrome re-lay-out the page, and the video then shows the opening
// card re-rendering and appearing a second time. So nothing is captured mid-recording.
async function captureStills(browser, slug, dir, errors) {
  const page = await openPage(browser, `${BASE}/t/local/${slug}/`, errors);
  const stills = [];
  try {
    await sleep(1200);
    stills.push(await shot(page, dir, 1));
    const tapped = await tapToOpen(page, opt(slug, "tap", "tap to open"));
    await sleep(tapped ? opt(slug, "openWait", 3200) : 800);
    stills.push(await shot(page, dir, 2));
    for (let i = 0; i < 9; i++) {
      await page.mouse.wheel({ deltaY: 420 });
      await sleep(650);
    }
    stills.push(await shot(page, dir, 3));
    return { stills, tapped };
  } finally {
    await page.close();
  }
}

// The video starts on the settled "Tap to open" card and shows only that, the tap, and
// a slow scroll: no loading state, no re-render.
async function captureVideo(browser, slug, raw, errors) {
  const page = await openPage(browser, `${BASE}/t/local/${slug}/`, errors);
  try {
    await sleep(opt(slug, "settle", 0));
    const recorder = await page.screencast({ path: raw, speed: 1 });
    await sleep(1600);
    const tapped = await tapToOpen(page, opt(slug, "tap", "tap to open"));
    await sleep(tapped ? 3200 : 800);
    for (let i = 0; i < 16; i++) {
      await page.mouse.wheel({ deltaY: 420 });
      await sleep(650);
    }
    await sleep(600);
    await recorder.stop();
    return { tapped };
  } finally {
    await page.close();
  }
}

async function capture(slug) {
  const dir = path.join(OUT, slug);
  await fs.mkdir(dir, { recursive: true });
  const raw = path.join(dir, "raw.webm");
  const errors = [];
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-first-run", "--autoplay-policy=no-user-gesture-required", "--mute-audio"],
  });
  try {
    const st = VIDEO_ONLY ? { stills: [] } : await captureStills(browser, slug, dir, errors);
    const video = await captureVideo(browser, slug, raw, errors);
    return { dir, raw, stills: st.stills, tapped: video.tapped, errors };
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
    "-y", "-loglevel", "error", "-ss", "0.4", "-i", raw,
    "-t", "24", "-vf", `fps=30,scale=720:-2:flags=lanczos,${watermark}`,
    "-c:v", "libx264", "-preset", "medium", "-crf", "26", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", "-an", preview,
  ]);
  // The poster is the video's own first frame, so the video starting never changes what is on screen.
  await run("ffmpeg", ["-y", "-loglevel", "error", "-i", preview, "-frames:v", "1", "-quality", "82", path.join(dir, "poster.webp")]);
  const outStills = [];
  if (VIDEO_ONLY) {
    await fs.rm(raw, { force: true });
    return { preview, outStills };
  }
  // Clean cover from the opened invitation (still 2), no watermark, for cards and the hero.
  await run("ffmpeg", ["-y", "-loglevel", "error", "-i", stills[opt(slug, "coverFrom", 2) - 1] ?? stills[0], "-vf", "scale=720:-2:flags=lanczos", "-quality", "86", path.join(dir, "cover.webp")]);
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
  if (!VIDEO_ONLY) await fs.writeFile(
    path.join(cap.dir, "manifest.json"),
    JSON.stringify({ slug, video: "preview.mp4", cover: "cover.webp", stills: outStills.map((p) => path.basename(p)), probe: stdout.trim(), bytes: size, tapped: cap.tapped, pageErrors: cap.errors }, null, 2),
  );
  console.log(`done  ${stdout.trim()}  ${(size / 1024).toFixed(0)} KB  opened=${cap.tapped}  errors=${cap.errors.length}`);
}
server.close();
