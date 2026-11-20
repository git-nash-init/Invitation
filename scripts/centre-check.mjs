// A single ceremony card must sit in the middle of the page, in the editor and for guests.
// Needs the site running: node scripts/centre-check.mjs [base-url]
import fs from "node:fs";
import { createHmac } from "node:crypto";
import puppeteer from "puppeteer-core";

const base = process.argv[2] ?? "http://localhost:3300";
const CHROME = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const SHOTS = process.env.SHOTS_DIR;
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
const cfg = { ceremonies: [{ name: "Shubh Vivaah", art: "media/vivaah.webp", date: "2026-12-06", time: "", venue: "Raj Laxmi Palace, Varanasi", mapUrl: "", enabled: true }] };
const hash = (status) => "#platform=" + Buffer.from(JSON.stringify({
  event: { status, commonLink: true, rsvpEvents: [], rsvpAutoManaged: true, rsvpManageable: false },
  sectionOverrides: { __templateConfig: cfg }, guest: null,
}), "utf8").toString("base64url");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const check = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) failed++; };
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
try {
  for (const slug of ["royale", "noor"]) {
    for (const [mode, qs, st] of [["guest", "", "published"], ["editor", "?edit=1", "draft"]]) {
      for (const [w, h] of [[1280, 800], [1920, 940]]) {
        const page = await browser.newPage();
        await page.setViewport({ width: w, height: h });
        await page.goto(`${base}/t/${mint(slug)}/${slug}/${qs}${hash(st)}`, { waitUntil: "load", timeout: 90_000 });
        await sleep(3000);
        await page.evaluate(() => {
          const el = [...document.querySelectorAll("button, a, [role=button], div, span")].filter((e) => /^\s*tap to open\s*$/i.test(e.textContent || "") && e.getBoundingClientRect().height > 0).pop();
          el?.click();
        });
        await sleep(8000);
        await page.evaluate(() => document.querySelector(".ryc-grid")?.scrollIntoView({ block: "center" }));
        await sleep(1500);
        const r = await page.evaluate(() => {
          const c = document.querySelector(".ryc-card");
          const b = c.getBoundingClientRect();
          return { cx: Math.round(b.left + b.width / 2), vw: innerWidth, width: Math.round(b.width) };
        });
        check(Math.abs(r.cx - r.vw / 2) <= 24, `${slug} ${mode} ${w}px: the card is centred (centre ${r.cx}, page centre ${r.vw / 2}, card ${r.width}px wide)`);
        if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: `${SHOTS}/${slug}-${mode}-${w}-centre.png` }); }
        await page.close();
      }
    }
  }
} finally { await browser.close(); }
console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
