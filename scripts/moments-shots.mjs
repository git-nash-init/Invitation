// Contact sheets of the celebration designs, for checking them by eye.
//   node scripts/moments-shots.mjs <outDir> [slug ...] [--edit]
// Needs the templates folder served on http://127.0.0.1:8765 (python -m http.server 8765 --directory private-templates).
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const run = promisify(execFile);
const CHROME = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = process.env.BASE ?? "http://127.0.0.1:8765";
const args = process.argv.slice(2);
const EDIT = args.includes("--edit");
const [out, ...named] = args.filter((a) => !a.startsWith("--"));
const all = JSON.parse(await fs.readFile("private-templates/_moments/designs.json", "utf8")).map((d) => d.slug);
const slugs = named.length ? named : all;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await fs.mkdir(out, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-first-run", "--mute-audio"] });
for (const slug of slugs) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
  await page.setViewport({ width: 390, height: 800, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(`${BASE}/${slug}/${EDIT ? "?edit=1" : ""}`, { waitUntil: "networkidle2", timeout: 60000 });
  await sleep(1200);
  const files = [];
  const shot = async () => { const f = path.join(out, `${slug}-${files.length}.png`); await page.screenshot({ path: f }); files.push(f); };
  await shot();
  if (!EDIT) {
    await page.click("[data-open]");
    await sleep(750);
    await shot();
    await sleep(3200);
    await shot();
  }
  const tops = await page.evaluate((edit) => {
    document.documentElement.style.scrollBehavior = "auto";
    const pick = edit ? ["hero", "countdown", "note", "schedule", "details", "gallery", "venue"] : ["countdown", "schedule", "gallery", "venue", "closing"];
    return pick.map((n) => { const e = document.querySelector(".mo-" + n); return e ? e.getBoundingClientRect().top + scrollY : -1; }).filter((y) => y >= 0);
  }, EDIT);
  for (const y of tops) {
    await page.evaluate((y) => window.scrollTo(0, y - 10), y);
    await sleep(1300);
    await shot();
  }
  while (files.length < 8) files.push(files[files.length - 1]);
  const sheet = path.join(out, `${slug}${EDIT ? "-edit" : ""}.jpg`);
  const inputs = files.slice(0, 8).flatMap((f) => ["-i", f]);
  await run("ffmpeg", ["-y", "-loglevel", "error", ...inputs, "-filter_complex", "xstack=inputs=8:layout=0_0|w0_0|w0+w1_0|w0+w1+w2_0|0_h0|w0_h0|w0+w1_h0|w0+w1+w2_h0,scale=1560:-2", "-q:v", "4", sheet]);
  for (const f of new Set(files)) await fs.rm(f, { force: true });
  console.log(slug, "->", sheet, errors.length ? "ERRORS: " + errors.join(" | ") : "no errors");
  await page.close();
}
await browser.close();
