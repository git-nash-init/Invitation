// Checks every template's preview pack. Exit code 0 only if all of it is good.
//   node scripts/verify-previews.mjs [slug ...]
//
// What it proves, per template (public/previews/<slug>/):
//   files        preview.mp4, poster.webp, cover.webp, still-1..3.webp exist
//   video        h.264, yuv420p, 720x1280, 8-30 s, no audio track, moov atom first (faststart)
//   NO GLITCH    the video opens on a settled screen, and the opening card never comes back after the
//                visitor has moved on. A re-render, a flash, or a second "Tap to open" fails this.
//                This is the "first 3 seconds" bug, caught by a number.
//   poster       poster.webp is the video's own first frame (so the video starting changes nothing)
//   covers       no two templates' covers look alike (perceptual difference on a 16x16 thumbnail)
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const run = promisify(execFile);
const ROOT = path.resolve("public/previews");
const STEADY_MIN = 0.94; // every frame in the first 0.8 s vs the first frame
const COVER_MIN_DIFF = 14; // mean absolute difference (0-255) between two covers' thumbnails

const slugs = process.argv.slice(2).length
  ? process.argv.slice(2)
  : (await fs.readdir(ROOT, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name).sort();

let failed = 0;
const ok = (c, msg) => { console.log(`  ${c ? "PASS" : "FAIL"}  ${msg}`); if (!c) failed++; };
const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "pv-"));

async function ssim(a, b) {
  const { stderr } = await run("ffmpeg", ["-hide_banner", "-i", a, "-i", b, "-lavfi", "ssim", "-f", "null", "-"]).catch((e) => e);
  const m = /All:([0-9.]+)/.exec(stderr ?? "");
  return m ? Number(m[1]) : 0;
}
async function frameAt(video, t, out) {
  await run("ffmpeg", ["-y", "-loglevel", "error", "-ss", String(t), "-i", video, "-frames:v", "1", "-vf", "scale=180:-2", out]);
}
async function thumb(file) {
  const { stdout } = await run("ffmpeg", ["-loglevel", "error", "-i", file, "-vf", "scale=16:16:flags=area,format=gray", "-f", "rawvideo", "-"], { encoding: "buffer", maxBuffer: 1 << 20 });
  return stdout;
}

const covers = {};
for (const slug of slugs) {
  console.log(`\n${slug}`);
  const dir = path.join(ROOT, slug);
  const need = ["preview.mp4", "poster.webp", "cover.webp", "still-1.webp", "still-2.webp", "still-3.webp"];
  const missing = [];
  for (const f of need) if (!(await fs.stat(path.join(dir, f)).catch(() => null))) missing.push(f);
  ok(missing.length === 0, missing.length ? `missing files: ${missing.join(", ")}` : "all 6 files present");
  if (missing.includes("preview.mp4")) continue;

  const video = path.join(dir, "preview.mp4");
  const { stdout } = await run("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,codec_name,pix_fmt,width,height:format=duration", "-of", "json", video]);
  const info = JSON.parse(stdout);
  const v = info.streams.find((s) => s.codec_type === "video");
  const dur = Number(info.format.duration);
  ok(v?.codec_name === "h264" && v?.pix_fmt === "yuv420p", `h264 / yuv420p (${v?.codec_name} / ${v?.pix_fmt})`);
  ok(v?.width === 720 && v?.height === 1280, `720x1280 (${v?.width}x${v?.height})`);
  ok(dur >= 8 && dur <= 30, `duration 8-30 s (${dur.toFixed(1)} s)`);
  ok(!info.streams.some((s) => s.codec_type === "audio"), "no audio track");
  const head = (await fs.readFile(video)).subarray(0, 64 * 1024);
  ok(head.indexOf("moov") !== -1, "faststart (moov atom at the start)");

  // THE GLITCH CHECK, in two parts. Frames are sampled every 0.1 s for the first 4 s and compared with
  // the first frame.
  //  1. The screen must be steady at the start: nothing moves much in the first 0.8 s.
  //  2. It must never RETURN: once the picture has left the opening card (the visitor tapped, so it
  //     changes), it may not come back to look like the opening card again. That "card, flash, card
  //     again" pattern is exactly the old first-3-seconds bug (the page re-rendered mid-recording).
  const f0 = path.join(tmp, `${slug}-0.png`);
  await frameAt(video, 0, f0);
  const sims = [];
  for (let i = 1; i <= 40; i++) {
    const t = i / 10;
    if (t > dur - 0.2) break;
    const ft = path.join(tmp, `${slug}-t${i}.png`);
    await frameAt(video, t.toFixed(2), ft);
    sims.push(await ssim(f0, ft));
  }
  const early = sims.slice(0, 8);
  const lowest = Math.min(...early);
  ok(lowest >= STEADY_MIN, `opening is steady: lowest similarity in the first 0.8 s is ${lowest.toFixed(3)} (needs >= ${STEADY_MIN})`);
  let left = false, returned = -1;
  sims.forEach((v, i) => {
    if (v < 0.85) left = true;
    else if (left && v >= 0.95 && returned < 0) returned = (i + 1) / 10;
  });
  ok(returned < 0, returned < 0 ? "never goes back to the opening card after leaving it" : `GLITCH: the opening card comes back at ${returned.toFixed(1)} s`);

  // Poster must be the video's first frame.
  const pst = path.join(tmp, `${slug}-poster.png`);
  await run("ffmpeg", ["-y", "-loglevel", "error", "-i", path.join(dir, "poster.webp"), "-vf", "scale=180:-2", pst]);
  const ps = await ssim(f0, pst);
  ok(ps >= 0.97, `poster matches the first frame (similarity ${ps.toFixed(3)})`);

  const cv = path.join(dir, "cover.webp");
  const cp = await run("ffprobe", ["-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", cv]);
  const [cw, ch] = cp.stdout.trim().split(",").map(Number);
  ok(cw === 720 && ch >= 960, `cover is 720 wide and at least 3:4 tall (${cw}x${ch})`);
  covers[slug] = await thumb(cv);
}

const names = Object.keys(covers);
if (names.length > 1) {
  console.log("\ncovers against each other");
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
    const a = covers[names[i]], b = covers[names[j]];
    let d = 0; for (let k = 0; k < a.length; k++) d += Math.abs(a[k] - b[k]);
    d /= a.length;
    if (d < COVER_MIN_DIFF * 1.6) ok(d >= COVER_MIN_DIFF, `${names[i]} vs ${names[j]}: difference ${d.toFixed(1)} (needs >= ${COVER_MIN_DIFF})`);
  }
  if (!failed) console.log("  PASS  no two covers look alike");
}
await fs.rm(tmp, { recursive: true, force: true });
console.log(failed ? `\n${failed} check(s) FAILED` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
