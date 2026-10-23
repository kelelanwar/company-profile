// Mobile + interaction smoke test for the 3D viewer.
import { chromium } from "playwright-core";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const url = process.argv[2] ?? "http://localhost:3000/en/projects/studio-geost";

const browser = await chromium.launch({
  executablePath: CHROME,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 2,
});

const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(5000);

const viewer = page.locator("[data-viewer]").first();
await viewer.scrollIntoViewIfNeeded();
await page.waitForTimeout(1500);
await viewer.screenshot({ path: "shot-mobile.png" });

await page.getByRole("button", { name: /reset/i }).click();
await page.waitForTimeout(800);

console.log("errors:", errors.length ? errors : "none");
await browser.close();
