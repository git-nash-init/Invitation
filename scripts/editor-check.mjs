// Checks the editor chrome of every template: no purple left, and the text size / alignment bar works.
// Needs the site running: node scripts/editor-check.mjs [base-url] [slug...]
import fs from "node:fs";
import { createHmac } from "node:crypto";
import puppeteer from "puppeteer-core";

const base = process.argv[2] ?? "http://localhost:3300";
const only = process.argv.slice(3);
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
  event: { status: "draft", commonLink: true, rsvpEvents: [], rsvpAutoManaged: true, rsvpManageable: false },
  sectionOverrides: { __templateConfig: {} },
  guest: null,
}), "utf8").toString("base64url");

const slugs = (only.length ? only : fs.readdirSync("private-templates", { withFileTypes: true })
  .filter((d) => d.isDirectory() && !SHARED.has(d.name) && fs.existsSync(`private-templates/${d.name}/editor.js`) || (d.isDirectory() && d.name === "destination-resort"))
  .map((d) => d.name)).filter((s) => fs.existsSync(`private-templates/${s}/index.html`));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const check = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) failed++; };

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
try {
  for (const slug of slugs) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`${base}/t/${mint(slug)}/${slug}/?edit=1${hash}`, { waitUntil: "load", timeout: 90_000 });
    await sleep(3500);
    // Open the gate if there is one, as the host would.
    await page.evaluate(() => {
      const el = [...document.querySelectorAll("button, a, [role=button], div, span")].filter((e) => /^\s*tap to open\s*$/i.test(e.textContent || "") && e.getBoundingClientRect().height > 0).pop();
      el?.click();
    });
    await sleep(8000);

    // 1. No purple: any visible element whose text, background or border colour is a purple hue.
    const purple = await page.evaluate(() => {
      const hue = (c) => {
        const m = /rgba?\((\d+), ?(\d+), ?(\d+)(?:, ?([\d.]+))?\)/.exec(c);
        if (!m) return null;
        const [r, g, b] = [m[1], m[2], m[3]].map((n) => Number(n) / 255);
        const a = m[4] === undefined ? 1 : Number(m[4]);
        const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
        if (d < 0.18 || a < 0.25) return null; // greys and near-transparent
        let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
        h = (h * 60 + 360) % 360;
        const l = (max + min) / 2;
        if (l > 0.93) return null;
        return h;
      };
      const bad = [];
      for (const el of document.querySelectorAll("body *")) {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        if (el.closest("svg")) continue;
        const cs = getComputedStyle(el);
        for (const [k, v] of [["color", cs.color], ["background", cs.backgroundColor], ["border", cs.borderTopColor]]) {
          const h = hue(v);
          if (h !== null && h >= 250 && h <= 300 && (k !== "border" || parseFloat(cs.borderTopWidth) > 0) && (k !== "color" || (el.textContent || "").trim())) {
            bad.push(`${el.tagName.toLowerCase()}${el.className && typeof el.className === "string" ? "." + el.className.split(" ")[0] : ""} ${k} ${v}`);
          }
        }
      }
      return [...new Set(bad)].slice(0, 12);
    });
    check(purple.length === 0, `${slug}: no purple in the editor${purple.length ? " -> " + purple.join(" | ") : ""}`);

    // 2. The size and alignment bar.
    const target = await page.evaluate(() => {
      const seen = (e) => { const r = e.getBoundingClientRect(); if (r.width <= 40 || r.height <= 8 || (e.textContent || "").trim().length <= 3) return false; const t = document.elementFromPoint(Math.min(r.left + 20, innerWidth - 1), Math.min(r.top + r.height / 2, innerHeight - 1)); return !!t && (t === e || e.contains(t)); };
      const el = [...document.querySelectorAll("[data-fmt]")].find(seen);
      if (!el) return null;
      el.setAttribute("data-tf-test", "1");
      el.scrollIntoView({ block: "center" });
      return el.getAttribute("data-fmt");
    });
    if (!target) { check(false, `${slug}: found an editable line`); await page.close(); continue; }
    await sleep(1200);
    const pos = await page.evaluate((t) => {
      const el = document.querySelector("[data-tf-test]");
      const r = el.getBoundingClientRect();
      return { x: r.left + 20, y: r.top + r.height / 2 };
    }, target);
    await page.mouse.click(pos.x, pos.y);
    await sleep(500);
    const shown = await page.evaluate(() => { const b = document.getElementById("tf-bar"); return !!b && getComputedStyle(b).display !== "none"; });
    check(shown, `${slug}: bar appears when a line is clicked (${target})`);
    if (shown) {
      const sel = (a) => `#tf-bar [data-tf="${a}"]`;
      for (const a of ["bigger", "bigger", "center"]) { await page.click(sel(a)); await sleep(150); }
      const r = await page.evaluate((t) => {
        const el = document.querySelector("[data-tf-test]");
        const rt = Object.values(window).find((v) => v && typeof v === "object" && v.config && typeof v.mode === "string");
        return { zoom: el.style.zoom, align: el.style.textAlign, saved: JSON.stringify(rt?.config?.textStyle ?? null) };
      }, target);
      check(r.zoom === "1.2" && r.align === "center", `${slug}: size 120% and centre applied (${r.zoom}, ${r.align})`);
      check(/"size":120/.test(r.saved) && /center/.test(r.saved), `${slug}: stored in the invitation config ${r.saved}`);
      if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: `${SHOTS}/${slug}-editor.png` }); }
      await page.click(sel("reset"));
    }
    // 3. Every symbol offered in the invocation picker actually loads.
    const syms = await page.evaluate(async () => {
      const rt = Object.values(window).find((v) => v && typeof v === "object" && Array.isArray(v.SYMBOLS));
      if (!rt) return null;
      const out = [];
      for (const sy of rt.SYMBOLS) {
        if (!sy.src) continue;
        const r = await fetch(new URL(sy.src, location.href)).catch(() => null);
        out.push([sy.label, r ? r.status : 0, r ? r.headers.get("content-type") : ""]);
      }
      return out;
    });
    if (syms) {
      const bad = syms.filter(([, st, ct]) => st !== 200 || !/svg/.test(ct));
      check(bad.length === 0, `${slug}: all ${syms.length} symbols load${bad.length ? " -> missing: " + bad.map((b) => b[0]).join(", ") : ""}`);
    }

    // 4. A ceremony venue and date row can be sized and aligned too (royale, noor).
    const venue = await page.evaluate(() => {
      const el = document.querySelector("[data-fmt$=\".venue\"][data-edit]");
      if (!el) return null;
      el.scrollIntoView({ block: "center" });
      return el.getAttribute("data-fmt");
    });
    if (venue) {
      await sleep(1200);
      const p = await page.evaluate((t) => {
        const el = [...document.querySelectorAll("[data-fmt]")].find((e) => e.getAttribute("data-fmt") === t);
        const r = el.getBoundingClientRect();
        return { x: r.left + 20, y: r.top + r.height / 2 };
      }, venue);
      await page.mouse.click(p.x, p.y);
      await sleep(500);
      await page.click("#tf-bar [data-tf=\"smaller\"]");
      await page.click("#tf-bar [data-tf=\"center\"]");
      const v = await page.evaluate((t) => { const el = [...document.querySelectorAll("[data-fmt]")].find((e) => e.getAttribute("data-fmt") === t); return { z: el.style.zoom, a: getComputedStyle(el).textAlign }; }, venue);
      check(v.z === "0.9" && v.a === "center", `${slug}: venue line (${venue}) resizes and centres (${v.z}, ${v.a})`);
      if (SHOTS) await page.screenshot({ path: `${SHOTS}/${slug}-venue.png` });
    }
    await page.close();
  }
} finally {
  await browser.close();
}
console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
