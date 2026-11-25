// Checks every template's editor: the music button is reachable and its picker opens, and (where a template
// has its own add / remove buttons) an event can be added, removed, and shows on the guest page.
// Needs the site running on port 3300: node scripts/events-check.mjs <slug...>
import fs from "node:fs";
import { createHmac } from "node:crypto";
import puppeteer from "puppeteer-core";
const base = "http://localhost:3300";
const secret = (() => { try { const m = /^ASSET_TOKEN_SECRET=(.+)$/m.exec(fs.readFileSync(".env.local", "utf8")); if (m) return m[1].trim().replace(/^["']|["']$/g, ""); } catch {} return "dev-only-asset-secret-do-not-use-in-production"; })();
const mint = (slug) => { const exp = Math.floor(Date.now() / 1000) + 3600; const p = `${slug}.${exp}`; return `${p}.${createHmac("sha256", secret).update(p).digest("base64url")}`; };
const mk = (cfg) => "#platform=" + Buffer.from(JSON.stringify({ event: { id: "00000000-0000-4000-8000-000000000000", status: "draft", commonLink: true, rsvpEvents: [], rsvpAutoManaged: true, rsvpManageable: false }, sectionOverrides: { __templateConfig: cfg }, guest: null }), "utf8").toString("base64url");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
let failed = 0; const check = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) failed++; };
const rtCount = () => { const rt = Object.values(window).find((v) => v && typeof v === "object" && v.config && typeof v.mode === "string"); return rt.config.ceremonies.length; };
for (const slug of process.argv.slice(2)) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${base}/t/${mint(slug)}/${slug}/?edit=1${mk({})}`, { waitUntil: "load", timeout: 90000 });
  await sleep(4000);
  // music
  const m = await page.evaluate(() => { const b = document.querySelector(".music-toggle--edit"); if (!b) return { has: false }; const r = b.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { has: true, w: r.width, h: r.height, top: t === b || b.contains(t), pos: getComputedStyle(b).position }; });
  check(m.has && m.w > 20 && m.top && m.pos === "fixed", `${slug}: music button is on screen and clickable ${JSON.stringify(m)}`);
  if (m.has && m.top) {
    await page.click(".music-toggle--edit"); await sleep(2500);
    const pop = await page.evaluate(() => { const p = document.querySelector(".music-pop"); return p ? { tracks: p.querySelectorAll(".music-pop__play").length, cats: p.querySelectorAll(".music-pop__cat").length, upload: !!p.querySelector('[data-music="upload"]'), w: p.getBoundingClientRect().width } : null; });
    check(pop && pop.tracks > 0 && pop.upload && pop.w > 150, `${slug}: music picker opens ${JSON.stringify(pop)}`);
    await page.keyboard.press("Escape"); await page.mouse.click(400, 400).catch(() => {}); await sleep(300);
  }
  // events (the three with add / remove buttons of their own)
  if (await page.$("[data-ev-add]")) {
    const n0 = await page.evaluate(rtCount);
    await page.evaluate(() => document.querySelector("[data-ev-add]").click()); await sleep(600);
    const n1 = await page.evaluate(rtCount);
    const cards1 = await page.$$eval("[data-ev-remove]", (e) => e.length);
    check(n1 === n0 + 1 && cards1 === n1, `${slug}: add an event (${n0} -> ${n1}, ${cards1} cards)`);
    await page.evaluate(() => { const i = document.querySelector('[data-ev-map]'); i.value = "https://maps.app.goo.gl/abc"; i.dispatchEvent(new Event("input", { bubbles: true })); });
    await page.evaluate(() => document.querySelector("[data-ev-remove]").click()); await sleep(600);
    await page.evaluate(() => document.querySelector("[data-ev-remove]").click()); await sleep(600);
    const n2 = await page.evaluate(rtCount);
    check(n2 === n1 - 2, `${slug}: remove events (${n1} -> ${n2})`);
    const cfg = await page.evaluate(() => { const rt = Object.values(window).find((v) => v && typeof v === "object" && v.config && typeof v.mode === "string"); return rt.config; });
    const v = await browser.newPage(); const verr = []; v.on("pageerror", (e) => verr.push(e.message));
    await v.goto(`${base}/t/${mint(slug)}/${slug}/${mk(cfg)}`, { waitUntil: "load", timeout: 90000 }); await sleep(3000);
    const g = await v.evaluate(() => ({ controls: document.querySelectorAll("[data-ev-remove],[data-ev-add],[data-ev-map]").length, hasNew: document.body.textContent.includes("New event") }));
    check(g.controls === 0 && g.hasNew && !verr.length, `${slug}: guest page shows the new event, no editor controls ${JSON.stringify(g)} ${verr[0] || ""}`);
    await v.close();
  }
  if (slug === "royale") check(!!(await page.$(".ryc-picks__own")), "royale: own-ceremony button is in the picker");
  check(errs.length === 0, `${slug}: no page errors${errs.length ? " -> " + errs[0] : ""}`);
  await page.close();
}
console.log(failed ? `\n${failed} FAILED` : "\nAll passed");
await browser.close();
