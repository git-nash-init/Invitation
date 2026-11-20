// Checks that every template's live (guest) page ends with the Pratham credit, and that it is
// absent in the editor and the stand-alone demo. Needs the site running: node scripts/footer-test.mjs [base-url]
import fs from "node:fs";
import { createHmac } from "node:crypto";
import puppeteer from "puppeteer-core";

const base = process.argv[2] ?? "http://localhost:3111";
const CHROME = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const SHOTS = process.env.SHOTS_DIR;
const SHARED = new Set(["_platform", "symbols", "music"]);

function secret() {
  if (process.env.ASSET_TOKEN_SECRET) return process.env.ASSET_TOKEN_SECRET;
  try {
    const m = /^ASSET_TOKEN_SECRET=(.+)$/m.exec(fs.readFileSync(".env.local", "utf8"));
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  } catch {}
  return "dev-only-asset-secret-do-not-use-in-production";
}
const mint = (slug) => {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const p = `${slug}.${exp}`;
  return `${p}.${createHmac("sha256", secret()).update(p).digest("base64url")}`;
};
const hash = "#platform=" + Buffer.from(JSON.stringify({
  event: { status: "published", commonLink: true, rsvpEvents: [], rsvpAutoManaged: true, rsvpManageable: false },
  sectionOverrides: { __templateConfig: {} },
  guest: null,
}), "utf8").toString("base64url");

const slugs = fs.readdirSync("private-templates", { withFileTypes: true })
  .filter((d) => d.isDirectory() && !SHARED.has(d.name) && fs.existsSync(`private-templates/${d.name}/index.html`))
  .map((d) => d.name);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const check = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) failed++; };

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
try {
  for (const slug of slugs) {
    const url = `${base}/t/${mint(slug)}/${slug}/`;
    for (const [label, w, h] of [["phone", 390, 800], ["desktop", 1280, 800]]) {
      const page = await browser.newPage();
      await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
      await page.goto(url + hash, { waitUntil: "load", timeout: 90_000 });
      await sleep(3500);
      const found = await page.evaluate(() => !!document.getElementById("pratham-credit"));
      check(found, `${slug} ${label}: credit present`);
      if (found) {
        // Guests meet a gate first: tap it open, as a guest would.
        const opened = await page.evaluate(() => {
          const el = [...document.querySelectorAll('button, a, [role=button], div, span')].filter((e) => /^s*tap to opens*$/i.test(e.textContent || '') && e.getBoundingClientRect().height > 0).pop();
          if (!el) return false;
          el.click();
          return true;
        });
        if (opened) await sleep(9000);
        // Scroll all the way down, in steps so smooth-scroll libraries keep up.
        for (let i = 0; i < 60; i++) {
          await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.9));
          await sleep(120);
        }
        await sleep(1500);
        const r = await page.evaluate(() => {
          const f = document.getElementById("pratham-credit");
          const b = f.getBoundingClientRect();
          const cx = Math.min(Math.max(b.left + b.width / 2, 1), innerWidth - 1);
          const cy = Math.min(Math.max(b.top + b.height / 2, 1), innerHeight - 1);
          const top = document.elementFromPoint(cx, cy);
          const a = f.querySelector("a");
          return {
            top: Math.round(b.top), bottom: Math.round(b.bottom), height: Math.round(b.height), vh: innerHeight,
            wide: Math.round(b.width) >= innerWidth - 1,
            covered: !(top && f.contains(top)),
            href: a.getAttribute("href"),
            lowest: Math.round(Math.max(...[...document.body.children].map((e) => e.getBoundingClientRect().bottom))),
          };
        });
        check(r.bottom <= r.vh + 2 && r.bottom >= r.vh - 60, `${slug} ${label}: sits at the very foot (bottom ${r.bottom} of ${r.vh})`);
        check(!r.covered, `${slug} ${label}: nothing covers it`);
        check(r.wide, `${slug} ${label}: full width`);
        check(/\?utm_source=invitation/.test(r.href), `${slug} ${label}: link ${r.href}`);
        if (SHOTS) {
          fs.mkdirSync(SHOTS, { recursive: true });
          await page.screenshot({ path: `${SHOTS}/${slug}-${label}.png` });
        }
      }
      await page.close();
    }
    // Never in the editor or the stand-alone demo.
    for (const [label, u] of [["editor", `${url}?edit=1${hash}`], ["stand-alone", url]]) {
      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 800 });
      await page.goto(u, { waitUntil: "load", timeout: 90_000 });
      await sleep(2500);
      check(!(await page.evaluate(() => !!document.getElementById("pratham-credit"))), `${slug} ${label}: no credit`);
      await page.close();
    }
  }
} finally {
  await browser.close();
}
console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
