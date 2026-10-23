// Converts an image (e.g. a 4096x2048 equirectangular PNG) to an optimized JPEG
// using the locally installed Chrome. Usage: node scripts/to-jpeg.mjs in.png out.jpg [quality]
import fs from "node:fs";
import { chromium } from "playwright-core";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const [input, output, quality = "0.82"] = process.argv.slice(2);

if (!input || !output) {
  console.error("usage: node scripts/to-jpeg.mjs <input> <output.jpg> [quality]");
  process.exit(1);
}

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage();
const base64 = fs.readFileSync(input).toString("base64");

const dataUrl = await page.evaluate(
  async ({ data, q }) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("no 2d context");
    context.drawImage(image, 0, 0);

    return canvas.toDataURL("image/jpeg", Number(q));
  },
  { data: base64, q: quality },
);

fs.writeFileSync(output, Buffer.from(dataUrl.split(",")[1], "base64"));
console.log(`${input} -> ${output} (${(fs.statSync(output).size / 1024).toFixed(0)} KB)`);

await browser.close();
