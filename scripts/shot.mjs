// Visual verification helper: screenshots a viewer route with headless Chrome.
// Usage: node scripts/shot.mjs [url] [out.png]
import { chromium } from "playwright-core";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const url = process.argv[2] ?? "http://localhost:3000/id/projects/studio-geost";
const out = process.argv[3] ?? "shot-viewer.png";

const browser = await chromium.launch({
  executablePath: CHROME,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on("console", (m) => {
  if (m.type() === "error") console.log("console error:", m.text());
});
page.on("pageerror", (e) => console.log("pageerror:", e.message));

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(6000);

const viewer = page.locator("[data-viewer]").first();
await viewer.scrollIntoViewIfNeeded();
await page.waitForTimeout(2000);
await viewer.screenshot({ path: out });
console.log("saved", out);
await browser.close();
