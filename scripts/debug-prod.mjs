import { chromium } from "playwright-core";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const logs = [];
page.on("console", (m) => logs.push(`${m.type()}: ${m.text().slice(0, 180)}`));
page.on("pageerror", (e) => logs.push(`PAGEERROR: ${e.message}`));
page.on("response", (r) => { if (r.status() >= 400) logs.push(`HTTP ${r.status()} ${r.url().slice(0, 100)}`); });

await page.goto("http://localhost:3000/id/preview", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

// 1) toggle
await page.getByRole("button", { name: "Dari deskripsi" }).click();
await page.waitForTimeout(400);
console.log("1) toggle aria-pressed:", await page.getByRole("button", { name: "Dari deskripsi" }).getAttribute("aria-pressed"));
await page.getByRole("button", { name: "Dari foto" }).click();
await page.waitForTimeout(400);

// 2) upload via native label
await page.setInputFiles("#preview-image-input", process.argv[2]);
await page.waitForTimeout(1500);
const thumb = await page.locator('label[for="preview-image-input"] img').count();
console.log("2) thumbnail rendered:", thumb > 0);

// 3) submit (no key -> expect localized error panel)
await page.fill("#preview-prompt", "ruang tamu industrial dengan bata ekspos");
await page.getByRole("button", { name: "Buat pratinjau" }).click();
await page.waitForTimeout(4000);
const text = await page.locator("body").innerText();
console.log("3) error panel shown:", /belum aktif|tidak tersedia|Gagal membuat/i.test(text));
await page.locator("section").nth(1).screenshot({ path: "shot-prod.png" });

console.log("logs:", logs.slice(0, 8));
await browser.close();
