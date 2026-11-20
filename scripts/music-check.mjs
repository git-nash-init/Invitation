// The music picker in the editor: lists the library, lets the host choose a track or "No music".
// Needs the site running: node scripts/music-check.mjs [base-url] [slug...]
import fs from "node:fs";
import { createHmac } from "node:crypto";
import puppeteer from "puppeteer-core";

const base = process.argv[2] ?? "http://localhost:3300";
const slugs = process.argv.length > 3 ? process.argv.slice(3) : ["royale", "noor", "papercut", "papercut-magenta", "rose-invitation", "destination-resort", "sage-envelope", "crimson-monogram"];
const m = /^ASSET_TOKEN_SECRET=(.+)$/m.exec(fs.readFileSync(".env.local", "utf8"));
const secret = m ? m[1].trim().replace(/^["']|["']$/g, "") : "dev-only-asset-secret-do-not-use-in-production";
const mint = (slug) => { const exp = Math.floor(Date.now() / 1000) + 3600; const p = `${slug}.${exp}`; return `${p}.${createHmac("sha256", secret).update(p).digest("base64url")}`; };
const hash = "#platform=" + Buffer.from(JSON.stringify({ event: { id: "11111111-1111-1111-1111-111111111111", status: "draft", commonLink: true }, sectionOverrides: { __templateConfig: {} }, guest: null })).toString("base64url");
const FAKE = { tracks: [
  { id: "test-one", title: "Test One", vibe: "Soft", seconds: 30, url: `${base}/favicon.ico` },
  { id: "test-two", title: "Test Two", vibe: "", seconds: 30, url: `${base}/icon.svg` },
] };

let failed = 0;
const check = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) failed++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
try {
  for (const slug of slugs) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setRequestInterception(true);
    page.on("request", (r) => {
      if (r.url().endsWith("/api/music")) r.respond({ status: 200, contentType: "application/json", body: JSON.stringify(FAKE) });
      else r.continue();
    });
    await page.goto(`${base}/t/${mint(slug)}/${slug}/?edit=1${hash}`, { waitUntil: "load", timeout: 90_000 });
    await sleep(3500);
    const opened = await page.evaluate(() => { const b = document.querySelector(".music-toggle--edit"); if (!b) return false; b.click(); return true; });
    if (!opened) { check(false, `${slug}: music button present in the editor`); await page.close(); continue; }
    await sleep(800);
    const items = await page.evaluate(() => [...document.querySelectorAll(".music-pop__item .music-pop__name")].map((e) => e.firstChild.textContent));
    check(items.length === 3 && items[0] === "No music" && items.includes("Test One"), `${slug}: library lists No music + tracks (${items.join(", ")})`);
    await page.evaluate(() => document.querySelector('[data-music="choose"][data-id="test-two"]').click());
    await sleep(300);
    let cfg = await page.evaluate(() => { const rt = Object.values(window).find((v) => v && typeof v === "object" && v.config && typeof v.mode === "string"); return rt.config.music; });
    check(cfg.enabled === true && cfg.trackId === "test-two" && /icon\.svg$/.test(cfg.src), `${slug}: choosing a track stores it (${JSON.stringify(cfg)})`);
    await page.evaluate(() => document.querySelector('[data-music="none"]').click());
    await sleep(300);
    cfg = await page.evaluate(() => { const rt = Object.values(window).find((v) => v && typeof v === "object" && v.config && typeof v.mode === "string"); return rt.config.music; });
    check(cfg.enabled === false, `${slug}: "No music" switches the music off`);
    await page.close();
  }
} finally { await browser.close(); }
console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
