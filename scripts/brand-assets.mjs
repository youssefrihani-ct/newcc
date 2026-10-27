#!/usr/bin/env node
// Copies the logos from docs/brand/ to public/brand/ and builds the derived assets (spec 5c):
// the icon-only "CC" mark (collapsed sidebar, favicon) and 1x/2x PNG sets.
// Also prints dominant colours so the design tokens can be derived from the real files.
import { mkdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "docs", "brand");
const out = join(root, "public", "brand");
mkdirSync(out, { recursive: true });

copyFileSync(join(src, "carecompanion-logo.webp"), join(out, "carecompanion-logo.webp"));
copyFileSync(join(src, "creativetechy-logo.png"), join(out, "creativetechy-logo.png"));

const cc = sharp(join(src, "carecompanion-logo.webp"));
const meta = await cc.metadata();
console.log("carecompanion-logo", meta.width, "x", meta.height);
const ct = await sharp(join(src, "creativetechy-logo.png")).metadata();
console.log("creativetechy-logo", ct.width, "x", ct.height);

// trim transparent/white margins first so the crop is relative to the artwork
const trimmed = await sharp(join(src, "carecompanion-logo.webp")).trim({ threshold: 12 }).toBuffer({ resolveWithObject: true });
const { width: tw, height: th } = trimmed.info;
console.log("trimmed", tw, "x", th);

// The mark sits at the left of the wordmark and is slightly wider than tall.
const markWidth = Math.min(tw, Math.round(th * 1.09));
const { data: raw, info: rawInfo } = await sharp(trimmed.data)
  .extract({ left: 0, top: 0, width: markWidth, height: th })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
// make the artwork background transparent: alpha from the distance to the corner colour
const [br, bg, bb] = [raw[0], raw[1], raw[2]];
for (let i = 0; i < raw.length; i += 4) {
  const d = Math.max(Math.abs(raw[i] - br), Math.abs(raw[i + 1] - bg), Math.abs(raw[i + 2] - bb));
  raw[i + 3] = Math.max(0, Math.min(255, Math.round(((d - 6) / 40) * 255)));
}
const mark = sharp(raw, { raw: { width: rawInfo.width, height: rawInfo.height, channels: 4 } });
await mark.clone().resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(join(out, "cc-mark.png"));
await mark.clone().resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(join(out, "favicon-32.png"));
await mark.clone().resize(180, 180, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } }).png().toFile(join(out, "apple-touch-icon.png"));

// 1x / 2x PNG sets of both logos
for (const [name, file] of [["carecompanion-logo", "carecompanion-logo.webp"], ["creativetechy-logo", "creativetechy-logo.png"]]) {
  const m = await sharp(join(src, file)).metadata();
  const base = 240;
  await sharp(join(src, file)).resize({ width: base }).png().toFile(join(out, `${name}@1x.png`));
  await sharp(join(src, file)).resize({ width: base * 2 }).png().toFile(join(out, `${name}@2x.png`));
  console.log(name, "1x/2x written (source", m.width, "x", m.height, ")");
}

// Dominant colours of the product logo, to derive the tokens from
const { data, info } = await sharp(join(src, "carecompanion-logo.webp")).resize(200).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const buckets = new Map();
for (let i = 0; i < data.length; i += 4) {
  if (data[i + 3] < 200) continue;
  const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
  if (r > 235 && g > 235 && b > 235) continue;
  const key = [r, g, b].map((v) => Math.round(v / 16) * 16).join(",");
  buckets.set(key, (buckets.get(key) ?? 0) + 1);
}
const top = [...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
for (const [key, n] of top) {
  const hex = "#" + key.split(",").map((v) => Math.min(255, Number(v)).toString(16).padStart(2, "0")).join("");
  console.log(hex, n);
}
console.log("channels", info.channels);
