// Screenshot QA with your installed Chrome.
//   node scripts/shots.mjs http://localhost:3300 out-dir /,/templates 1440,500
// Writes <out-dir>/<path>-<width>.jpg (full page) and prints horizontal-overflow warnings.
import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const [base, out, pathsArg = "/", widthsArg = "1440"] = process.argv.slice(2);
if (!base || !out) {
  console.error("usage: node scripts/shots.mjs <base-url> <out-dir> [/a,/b] [1440,500]");
  process.exit(1);
}
const CHROME = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
await fs.mkdir(out, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--autoplay-policy=no-user-gesture-required", "--mute-audio"] });
try {
  for (const w of widthsArg.split(",").map(Number)) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: w < 700 ? 900 : 900, deviceScaleFactor: 1 });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 140)));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 140)));
    for (const p of pathsArg.split(",")) {
      await page.goto(base + p, { waitUntil: "load", timeout: 90_000 });
      await new Promise((r) => setTimeout(r, 2800));
      // Reveal-on-scroll content: scroll through once so everything has appeared.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 400) {
          window.scrollTo({ top: y, behavior: 'instant' });
          await new Promise((r) => setTimeout(r, 350));
        }
        window.scrollTo({ top: 0, behavior: 'instant' });
      });
      await new Promise((r) => setTimeout(r, 1200));
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      const name = (p === "/" ? "home" : p.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")) + `-${w}.jpg`;
      await page.screenshot({ path: path.join(out, name), fullPage: true, type: "jpeg", quality: 72 });
      console.log(`${p} @${w}: overflow=${overflow}px ${overflow > 1 ? "  <-- horizontal scroll!" : ""}`);
    }
    if (errors.length) console.log(`  console errors @${w}:`, [...new Set(errors)].slice(0, 4));
    await page.close();
  }
} finally {
  await browser.close();
}
