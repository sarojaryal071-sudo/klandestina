#!/usr/bin/env node
// build-logo.mjs
//
// Generates the cream-circle donkey badge (header/footer logo) and the
// full favicon/touch-icon/PWA-icon set from the untouched source photo
// at images/logo/donkey.png — never overwritten by this script. Same
// one-off/manual-run shape as scripts/build-hero.mjs (`npm i --no-save
// sharp && node scripts/build-logo.mjs`), not wired into a GitHub Action
// since the source logo doesn't change on its own.
//
// Every output is the same composite at a different pixel size: the
// donkey (trimmed to its real content, transparent padding removed) is
// centered on a solid cream (#f6f1e7) circle with ~12% padding on every
// side, built fresh at each target size rather than just resizing one
// master down — crisp edges on the circle at 16px matter as much as at
// 512px. favicon.ico is assembled from the 16/32/48 PNGs afterward (via
// Pillow — sharp has no ICO encoder, same tool this repo's existing
// favicon.ico was already built with).

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const LOGO_DIR = path.join(ROOT, "images", "logo");
const CREAM = "#f6f1e7";
const PADDING_FRACTION = 0.12; // the donkey occupies (1 - 2*0.12) = 76% of the circle's diameter

// Real content bounds inside donkey.png — it ships with transparent
// padding around the artwork (892x892 source, ~574x858 of actual
// content) — measured once via sharp's own .trim() rather than
// hardcoded, so this keeps working if the source file is ever replaced.
async function trimmedDonkeyBuffer() {
  const srcPath = path.join(LOGO_DIR, "donkey.png");
  const { data, info } = await sharp(srcPath).trim().toBuffer({ resolveWithObject: true });
  return { buffer: data, width: info.width, height: info.height };
}

async function buildBadge(donkey, size) {
  const circleSvg = Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${CREAM}"/></svg>`);
  const inner = Math.round(size * (1 - 2 * PADDING_FRACTION));

  const donkeyResized = await sharp(donkey.buffer)
    .resize({ width: inner, height: inner, fit: "inside" })
    .toBuffer({ resolveWithObject: true });

  const left = Math.round((size - donkeyResized.info.width) / 2);
  const top = Math.round((size - donkeyResized.info.height) / 2);

  return sharp(circleSvg)
    .composite([{ input: donkeyResized.data, left, top }])
    .png();
}

async function writePng(donkey, size, outPath) {
  const img = await buildBadge(donkey, size);
  await img.clone().png({ compressionLevel: 9 }).toFile(outPath);
  return outPath;
}

async function writeWebp(donkey, size, outPath) {
  const img = await buildBadge(donkey, size);
  await img.clone().webp({ quality: 90 }).toFile(outPath);
  return outPath;
}

async function run() {
  await mkdir(LOGO_DIR, { recursive: true });
  const donkey = await trimmedDonkeyBuffer();
  console.log(`[build-logo] donkey.png trimmed to ${donkey.width}x${donkey.height}`);

  // Header/footer badge — the one actually shown in normal browsing, so
  // it gets both formats (components/logo.js picks WebP first via
  // <picture>, same pattern the hero photo already uses).
  await writePng(donkey, 256, path.join(LOGO_DIR, "badge.png"));
  await writeWebp(donkey, 256, path.join(LOGO_DIR, "badge.webp"));

  // Favicon PNG variants
  await writePng(donkey, 16, path.join(LOGO_DIR, "favicon-16x16.png"));
  await writePng(donkey, 32, path.join(LOGO_DIR, "favicon-32x32.png"));
  const favicon48 = path.join(LOGO_DIR, "favicon-48x48.png");
  await writePng(donkey, 48, favicon48);

  // apple-touch-icon and PWA icons — PNG only; neither context (iOS
  // home screen, PWA manifests) reliably accepts WebP for these roles.
  await writePng(donkey, 180, path.join(LOGO_DIR, "apple-touch-icon.png"));
  await writePng(donkey, 192, path.join(LOGO_DIR, "icon-192.png"));
  await writePng(donkey, 512, path.join(LOGO_DIR, "icon-512.png"));

  console.log("[build-logo] wrote badge.png/.webp, favicon-16/32/48, apple-touch-icon-180, icon-192/512");
}

run().catch((err) => {
  console.error("[build-logo] failed:", err);
  process.exit(1);
});
