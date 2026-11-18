// Makes the protected preview media for each template:
//   previews-out/<slug>/preview.mp4   short phone-sized walkthrough, watermarked
//   previews-out/<slug>/still-1..3.webp   watermarked stills
//   previews-out/<slug>/manifest.json
// It drives your installed Chrome through the real template (via a short-lived
// signed link) and encodes with ffmpeg. Nothing here is uploaded: see upload-previews.mjs.
//
// Run:  ASSET_TOKEN_SECRET=... BASE_URL=http://localhost:3200 node scripts/make-previews.mjs [slug ...]
import { createHmac } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const run = promisify(execFile);

const SECRET = process.env.ASSET_TOKEN_SECRET;
const BASE = (process.env.BASE_URL ?? "http://localhost:3200").replace(/\/+$/, "");
const CHROME =
  process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const FONT = process.env.WATERMARK_FONT ?? "C\\:/Windows/Fonts/arialbd.ttf"; // ffmpeg filter escaping
const MARK = process.env.WATERMARK_TEXT ?? "SutraLuxe preview";
const OUT = path.resolve("previews-out");

const ALL = ["royale", "noor", "rose-invitation", "papercut-magenta", "papercut"];
const slugs = process.argv.slice(2).length ? process.argv.slice(2) : ALL;

if (!SECRET || SECRET.length < 32) {
  console.error("Set ASSET_TOKEN_SECRET to the same value the site uses (at least 32 characters).");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function mintToken(slug, ttl = 900) {
  const exp = Math.floor(Date.now() / 1000) + ttl;
  const payload = `${slug}.${exp}`;
  return `${payload}.${createHmac("sha256", SECRET).update(payload).digest("base64url")}`;
}

// Two marks: a small corner tag, and a faint diagonal one across the middle.
const watermark = [
  `drawtext=fontfile='${FONT}':text='${MARK}':fontsize=22:fontcolor=white@0.85:borderw=2:bordercolor=black@0.55:x=w-tw-16:y=h-th-18`,
  `drawtext=fontfile='${FONT}':text='${MARK}':fontsize=38:fontcolor=white@0.16:borderw=1:bordercolor=black@0.12:x=(w-tw)/2:y=(h-th)/2`,
].join(",");

async function capture(slug) {
  const dir = path.join(OUT, slug);
  await fs.mkdir(dir, { recursive: true });
  const raw = path.join(dir, "raw.webm");
  const url = `${BASE}/t/${mintToken(slug)}/${slug}/`;

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-first-run", "--autoplay-policy=no-user-gesture-required", "--mute-audio"],
  });
  const stills = [];
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 360, height: 640, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60_000 });
    await sleep(1500);

    const recorder = await page.screencast({ path: raw, speed: 1 });

    // Opening card, then the tap that opens the invitation.
    await sleep(1800);
    stills.push(await shot(page, dir, 1));
    const tapped = await page.evaluate(() => {
      const els = [...document.querySelectorAll("button, a, div, span")];
      const el = els.find((e) => /tap to open/i.test(e.textContent || "") && e.children.length < 4);
      if (el) { el.click(); return true; }
      return false;
    });
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

async function encode({ dir, raw, stills }) {
  const preview = path.join(dir, "preview.mp4");
  // Phone-sized, no sound (the bot and site add music separately), starts instantly in Telegram.
  await run("ffmpeg", [
    "-y", "-loglevel", "error", "-i", raw,
    "-t", "24", "-vf", `fps=24,scale=540:-2,${watermark}`,
    "-c:v", "libx264", "-preset", "medium", "-crf", "28", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", "-an", preview,
  ]);
  const outStills = [];
  for (const [i, file] of stills.entries()) {
    const out = path.join(dir, `still-${i + 1}.webp`);
    await run("ffmpeg", ["-y", "-loglevel", "error", "-i", file, "-vf", `scale=540:-2,${watermark}`, "-quality", "80", out]);
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
  const { preview, outStills } = await encode(cap);
  const { stdout } = await run("ffprobe", [
    "-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=width,height,duration", "-of", "csv=p=0", preview,
  ]);
  const size = (await fs.stat(preview)).size;
  await fs.writeFile(
    path.join(cap.dir, "manifest.json"),
    JSON.stringify({ slug, video: "preview.mp4", stills: outStills.map((p) => path.basename(p)), probe: stdout.trim(), bytes: size, tapped: cap.tapped, pageErrors: cap.errors }, null, 2),
  );
  console.log(`done  ${stdout.trim()}  ${(size / 1024).toFixed(0)} KB  opened=${cap.tapped}  errors=${cap.errors.length}`);
}
