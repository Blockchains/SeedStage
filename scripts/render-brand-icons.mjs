import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const svg = readFileSync(new URL("../public/favicon.svg", import.meta.url), "utf8");

function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const dir = Buffer.alloc(16 * images.length);
  let offset = 6 + dir.length;
  const parts = [header, dir];
  images.forEach((image, index) => {
    const at = index * 16;
    dir[at] = image.size >= 256 ? 0 : image.size;
    dir[at + 1] = image.size >= 256 ? 0 : image.size;
    dir.writeUInt16LE(1, at + 4);
    dir.writeUInt16LE(32, at + 6);
    dir.writeUInt32LE(image.png.length, at + 8);
    dir.writeUInt32LE(offset, at + 12);
    offset += image.png.length;
    parts.push(image.png);
  });
  return Buffer.concat(parts);
}

const browser = await chromium.launch();
const page = await browser.newPage();
const rendered = [];
for (const size of [16, 32, 48, 180, 192, 512]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<!doctype html><style>html,body{margin:0;background:#000}svg{width:${size}px;height:${size}px;display:block}</style>${svg}`);
  const png = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: size, height: size } });
  rendered.push({ size, png });
}
await browser.close();

const bySize = Object.fromEntries(rendered.map((image) => [image.size, image.png]));
const root = new URL("../public/", import.meta.url);
writeFileSync(new URL("favicon-16x16.png", root), bySize[16]);
writeFileSync(new URL("favicon-32x32.png", root), bySize[32]);
writeFileSync(new URL("apple-touch-icon.png", root), bySize[180]);
writeFileSync(new URL("icon-192.png", root), bySize[192]);
writeFileSync(new URL("icon-512.png", root), bySize[512]);
writeFileSync(new URL("favicon.ico", root), ico([16, 32, 48].map((size) => ({ size, png: bySize[size] }))));
console.log("icons", rendered.map((image) => `${image.size}:${image.png.length}`).join(" "));
