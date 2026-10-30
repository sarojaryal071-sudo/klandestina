#!/usr/bin/env node
// build-hero.mjs
//
// Generates the hero section's responsive image variants from the two
// untouched source photos in images/hero/ (hero-desktop-source.png,
// hero-mobile-source.png — real photos of the restaurant, never
// recoloured/cropped/restyled; see README's "Hero photo" section).
// Writes AVIF + WebP + JPG at several widths for each, straight resizes
// only (no cropping — both sources are already shot/cropped at the
// aspect ratio they're served at, 16:9 desktop and 9:16 mobile), to
// images/hero/hero-{desktop,mobile}-{width}.{avif,webp,jpg}.
//
// Not wired into a GitHub Action (unlike build-gallery.mjs) — there's
// only ever two source photos and they don't change on their own the
// way a gallery folder does, so this is a one-off/occasional manual run
// (`npm i --no-save sharp && node scripts/build-hero.mjs`) whose output
// gets committed directly, the same "no build step wired up for it"
// treatment README's SEO section already gives images/og/og.jpg.

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const HERO_DIR = path.join(ROOT, "images", "hero");

const QUALITY = { avif: 72, webp: 74, jpg: 75 };

// Requested per the task: desktop 1280/1920/2560, mobile 720/1080/1440.
// Both source photos are smaller than their largest requested width
// (1672px/940px long edge respectively) — upscaling past a source's own
// resolution would invent detail that isn't there and work against "do
// not ... restyle the images themselves", so any requested width above
// the source's own width is dropped and the source's native width is
// generated instead (deduped against whatever requested widths already
// fit). See README/the task report for this being called out explicitly.
const VARIANTS = {
  desktop: { file: "hero-desktop-source.png", widths: [1280, 1920, 2560] },
  mobile: { file: "hero-mobile-source.png", widths: [720, 1080, 1440] }
};

function widthsToGenerate(requested, nativeWidth) {
  const fitting = requested.filter((w) => w <= nativeWidth);
  if (fitting.length === requested.length) return fitting; // every requested width already fits
  return [...new Set([...fitting, nativeWidth])].sort((a, b) => a - b);
}

async function generateOne(buffer, width, outBasePath) {
  const resized = sharp(buffer).resize({ width });
  const sizes = {};

  await resized.clone().avif({ quality: QUALITY.avif, effort: 6 }).toFile(`${outBasePath}-${width}.avif`);
  sizes.avif = (await readFile(`${outBasePath}-${width}.avif`)).length;

  await resized.clone().webp({ quality: QUALITY.webp }).toFile(`${outBasePath}-${width}.webp`);
  sizes.webp = (await readFile(`${outBasePath}-${width}.webp`)).length;

  // mozjpeg (already sharp's default jpeg encoder here, same as
  // build-gallery.mjs) is specifically good at not banding smooth dark
  // gradients at moderate quality — this is the fallback format, used by
  // the browsers least likely to also support AVIF/WebP.
  await resized.clone().jpeg({ quality: QUALITY.jpg, mozjpeg: true }).toFile(`${outBasePath}-${width}.jpg`);
  sizes.jpg = (await readFile(`${outBasePath}-${width}.jpg`)).length;

  return sizes;
}

async function run() {
  const report = [];

  for (const [key, { file, widths: requested }] of Object.entries(VARIANTS)) {
    const srcPath = path.join(HERO_DIR, file);
    const buffer = await readFile(srcPath);
    const meta = await sharp(buffer).metadata();
    const nativeWidth = meta.width;

    const widths = widthsToGenerate(requested, nativeWidth);
    const skipped = requested.filter((w) => w > nativeWidth);
    if (skipped.length) {
      console.log(
        `[build-hero] ${key}: source is ${nativeWidth}px wide — skipping requested width(s) ${skipped.join(", ")} (would upscale) and generating the native width (${nativeWidth}px) instead`
      );
    }

    for (const width of widths) {
      const outBasePath = path.join(HERO_DIR, `hero-${key}`);
      const sizes = await generateOne(buffer, width, outBasePath);
      report.push({ key, width, ...sizes });
      console.log(
        `[build-hero] hero-${key}-${width}: avif ${(sizes.avif / 1024).toFixed(1)}KB, webp ${(sizes.webp / 1024).toFixed(1)}KB, jpg ${(sizes.jpg / 1024).toFixed(1)}KB`
      );
    }
  }

  return report;
}

run().catch((err) => {
  console.error("[build-hero] failed:", err);
  process.exit(1);
});
