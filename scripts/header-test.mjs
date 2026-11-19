// Verifies the header: normal at the top, tucks away scrolling down, returns scrolling up,
// keeps one size on every page, and never sits on top of the first piece of content.
import puppeteer from "puppeteer-core";

const base = process.argv[2] ?? "http://localhost:3300";
const CHROME = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const check = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) failed++; };

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  const state = () => page.evaluate(() => {
    const h = document.querySelector("header");
    const r = h.getBoundingClientRect();
    const cs = getComputedStyle(h);
    return { top: Math.round(r.top), height: Math.round(r.height), width: Math.round(r.width), opacity: Number(cs.opacity), inert: h.hasAttribute("inert") };
  });
  const sizes = {};
  for (const p of ["/", "/templates", "/preview/royale", "/terms", "/contact"]) {
    await page.goto(base + p, { waitUntil: "load", timeout: 90_000 });
    await sleep(1500);
    const s = await state();
    sizes[p] = `${s.width}x${s.height}@${s.top}`;
    // No content may sit under the header. The home hero's picture is meant to run up behind it,
    // so what must clear the header is the first piece of real content: the first heading and the
    // first button or link inside <main>.
    const gap = await page.evaluate(() => {
      const h = document.querySelector("header").getBoundingClientRect();
      const first = [...document.querySelectorAll("main h1, main h2, main a, main button")].map((e) => e.getBoundingClientRect()).filter((r) => r.height > 0).sort((a, b) => a.top - b.top)[0];
      return Math.round(first.top - h.bottom);
    });
    check(gap >= 0, `${p}: first content starts ${gap}px below the header (no overlap)`);
    if (p === "/") {
      check(s.opacity === 1 && s.top >= 0, "home: header visible at the top");
      await page.evaluate(() => window.scrollTo(0, 900));
      await sleep(250); await page.evaluate(() => window.scrollTo(0, 1500));
      await sleep(900);
      const down = await state();
      check(down.opacity < 0.1 && down.top < -20, `scrolling down hides it (opacity ${down.opacity}, top ${down.top})`);
      await page.evaluate(() => window.scrollTo(0, 1380));
      await sleep(900);
      const up = await state();
      check(up.opacity === 1 && up.top >= 0, `scrolling up brings it back (opacity ${up.opacity}, top ${up.top})`);
      check(up.height === s.height && up.width === s.width, "same size after the motion");
    }
  }
  const uniq = new Set(Object.values(sizes));
  check(uniq.size === 1, `identical size and place on every page: ${[...uniq].join(" | ")}`);
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
