// Checks the "Edit all text" panel of every template: it lists the fixed lines, a change shows on the page,
// is stored on the invitation, reaches the guest page, and "Put back" restores the original.
// Needs the site running on port 3300: node scripts/wording-check.mjs <slug...>
import fs from "node:fs";
import { createHmac } from "node:crypto";
import puppeteer from "puppeteer-core";
const base = "http://localhost:3300";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const secret = (() => { try { const m = /^ASSET_TOKEN_SECRET=(.+)$/m.exec(fs.readFileSync(".env.local", "utf8")); if (m) return m[1].trim().replace(/^["']|["']$/g, ""); } catch {} return "dev-only-asset-secret-do-not-use-in-production"; })();
const mint = (slug) => { const exp = Math.floor(Date.now() / 1000) + 3600; const p = `${slug}.${exp}`; return `${p}.${createHmac("sha256", secret).update(p).digest("base64url")}`; };
const mk = (cfg) => "#platform=" + Buffer.from(JSON.stringify({ event: { status: "draft", commonLink: true, rsvpEvents: [], rsvpAutoManaged: true, rsvpManageable: false }, sectionOverrides: { __templateConfig: cfg }, guest: null }), "utf8").toString("base64url");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slugs = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
let failed = 0; const check = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) failed++; };
for (const slug of slugs) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${base}/t/${mint(slug)}/${slug}/?edit=1${mk({})}`, { waitUntil: "load", timeout: 90000 });
  await sleep(4000);
  await page.click("#wd-open");
  await page.waitForFunction(() => document.querySelectorAll("#wd-panel .wd-row").length > 0, { timeout: 60000 }).catch(() => {});
  await sleep(2500);
  const keys = await page.$$eval("#wd-panel .wd-row textarea", (els) => els.map((e) => e.value));
  console.log(`\n== ${slug}: ${keys.length} lines`); console.log("   " + keys.map((k) => k.slice(0, 44)).join(" | "));
  check(keys.length > 0, `${slug}: panel lists fixed lines`);
  if (keys.length) {
    const key = keys.find((k) => k.length > 4) || keys[0];
    await page.evaluate((key) => { const t = [...document.querySelectorAll("#wd-panel textarea")].find((e) => e.value === key); t.focus(); t.value = "ZZ changed wording"; t.dispatchEvent(new Event("input", { bubbles: true })); }, key);
    await sleep(900);
    const r = await page.evaluate(() => { const rt = Object.values(window).find((v) => v && typeof v === "object" && v.config && typeof v.mode === "string"); const inDom = [...document.querySelectorAll("body *")].some((e) => !e.closest("#wd-panel") && [...e.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.includes("ZZ changed wording"))); return { saved: JSON.stringify(rt.config.wording), inDom }; });
    check(r.inDom, `${slug}: "${key.slice(0, 30)}" replaced on the page`);
    check(/ZZ changed wording/.test(r.saved), `${slug}: stored in config.wording`);
    // guest view with the override
    const v = await browser.newPage();
    await v.goto(`${base}/t/${mint(slug)}/${slug}/${mk({ wording: [{ k: key, v: "ZZ guest sees this" }] })}`, { waitUntil: "load", timeout: 90000 });
    await sleep(3500);
    const g = await v.evaluate((key) => { const txt = document.body.textContent; return { has: txt.includes("ZZ guest sees this"), panel: !!document.getElementById("wd-open") }; }, key);
    check(g.has && !g.panel, `${slug}: guest page shows the replacement, no editor button`);
    await v.close();
    // put back
    await page.evaluate(() => { document.querySelector("#wd-panel .wd-row.is-changed .wd-reset").click(); });
    await sleep(500);
    const back = await page.evaluate(() => { const rt = Object.values(window).find((v) => v && typeof v === "object" && v.config && typeof v.mode === "string"); return { n: rt.config.wording.length, still: document.body.textContent.replace(document.getElementById("wd-panel").textContent, "").includes("ZZ changed wording") }; });
    check(back.n === 0 && !back.still, `${slug}: Put back restores the original`);
  }
  check(errs.length === 0, `${slug}: no page errors${errs.length ? " -> " + errs[0] : ""}`);
  if (process.env.SHOT) await page.screenshot({ path: `${process.env.TEMP}/shots/wording-${slug}.png` });
  await page.close();
}
console.log(failed ? `\n${failed} FAILED` : "\nAll passed");
await browser.close();
