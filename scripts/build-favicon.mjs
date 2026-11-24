#!/usr/bin/env node
// build-favicon.mjs
//
// Generates the favicon/apple-touch-icon/PWA-icon set directly from the
// "KLANDESTINA" text wordmark on the site's own navy background — no
// source image, nothing to keep in sync with a logo file. Replaces the
// previous generator script, which composited a mascot image onto a
// cream circle; that mascot was never actually Klandestina's logo and
// has been removed from the site entirely (see components/logo.js).
//
// Same one-off/manual-run shape as the rest of this repo's image tooling
// (`npm i --no-save sharp && node scripts/build-favicon.mjs`), not wired
// into a GitHub Action since this never changes on its own. Only writes
// PNGs — favicon.ico itself has no sharp encoder, so assembling the
// 16/32/48 PNGs into favicon.ico afterward is still a separate manual
// step (Pillow:
// `Image.open("favicon-16x16.png").save("favicon.ico", sizes=[(16,16),(32,32),(48,48)])`
// with the other two images passed via `append_images`).

import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const LOGO_DIR = path.join(ROOT, "images", "logo");

// The site's own --bg/--ink tokens (style.css :root) — not a separate
// literal choice, just written out since this script has no CSS to read
// them from.
const BG = "#161b28";
const INK = "#e8e0d0";

const TEXT_WIDTH_FRACTION = 0.86; // how much of the canvas's own width the word should span
const REFERENCE_FONT_SIZE = 200; // arbitrary — only used to measure the font's real glyph widths

function textSvg(fontSize, fill) {
  // No fixed canvas here — just the glyphs, rendered oversized onto a
  // generous transparent square so measureTextWidth() below can safely
  // trim() to their real ink bounds without anything clipping first.
  const canvas = fontSize * 8;
  return `<svg width="${canvas}" height="${canvas}" xmlns="http://www.w3.org/2000/svg">
    <text
      x="${canvas / 2}" y="${canvas / 2}"
      text-anchor="middle" dominant-baseline="central"
      font-family="Bebas Neue" font-size="${fontSize}" fill="${fill}"
    >KLANDESTINA</text>
  </svg>`;
}

// SVG's own textLength/lengthAdjust turned out not to reliably compress
// Bebas Neue's glyphs under sharp's renderer (confirmed empirically — the
// word just overflowed the canvas instead) — so this measures the font's
// real rendered width at one reference size via trim(), then scales that
// size linearly to hit whatever target width a given icon needs, the
// same "measure, then compute the needed size" approach as this repo's
// other image scripts (e.g. build-hero.mjs's crop math) rather than
// trusting an SVG feature that didn't actually work here.
async function measureTextWidth(fontSize) {
  const { info } = await sharp(Buffer.from(textSvg(fontSize, "#ffffff")))
    .trim()
    .toBuffer({ resolveWithObject: true });
  return info.width;
}

function svgFor(size, fontSize) {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="${BG}"/>
    <text
      x="50%" y="53%"
      text-anchor="middle" dominant-baseline="central"
      font-family="Bebas Neue" font-size="${fontSize}" fill="${INK}"
    >KLANDESTINA</text>
  </svg>`;
}

async function writePng(size, fontSizeForTargetWidth, outPath) {
  const fontSize = Math.round(fontSizeForTargetWidth);
  await sharp(Buffer.from(svgFor(size, fontSize))).png({ compressionLevel: 9 }).toFile(outPath);
  console.log(`[build-favicon] wrote ${path.relative(ROOT, outPath)} (${size}x${size}, font-size ${fontSize})`);
}

async function run() {
  await mkdir(LOGO_DIR, { recursive: true });

  const referenceWidth = await measureTextWidth(REFERENCE_FONT_SIZE);
  console.log(`[build-favicon] "KLANDESTINA" measures ${referenceWidth}px wide at font-size ${REFERENCE_FONT_SIZE}`);

  const sizes = [
    [16, "favicon-16x16.png"],
    [32, "favicon-32x32.png"],
    [48, "favicon-48x48.png"],
    [180, "apple-touch-icon.png"],
    [192, "icon-192.png"],
    [512, "icon-512.png"],
  ];

  for (const [size, filename] of sizes) {
    const targetWidth = size * TEXT_WIDTH_FRACTION;
    const fontSize = REFERENCE_FONT_SIZE * (targetWidth / referenceWidth);
    await writePng(size, fontSize, path.join(LOGO_DIR, filename));
  }

  console.log("[build-favicon] PNGs written — assemble favicon.ico from the 16/32/48 set by hand (see this file's own header comment).");
}

run().catch((err) => {
  console.error("[build-favicon] failed:", err);
  process.exit(1);
});
