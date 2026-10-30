#!/usr/bin/env node
// build-hero.mjs
//
// Generates the hero section's responsive image variants from the two
// untouched source photos in images/hero/ (hero-desktop-source.png,
// hero-mobile-source.png — real photos of the restaurant, never
// recoloured/cropped/restyled; see README's "Hero photo" section).
// Writes AVIF + WebP + JPG at several widths for each to
// images/hero/hero-{desktop,mobile}-{width}.{avif,webp,jpg}.
//
// Desktop is a straight resize (already shot/cropped at the 16:9 it's
// served at). Mobile is EXTRACTED (sharp's .extract(), a non-destructive
// read-time crop — the source file itself is never touched or
// overwritten) from the portrait source before resizing: the mobile
// hero layout needs the sign/window positioned in the upper portion of
// the screen with a tall "fade to solid" zone below for the text block,
// which the full 9:16 photo's own proportions don't give — the sign
// band alone already spans roughly half of the full photo's height. See
// README's "Hero photo" for the exact crop box and the geometry reasoning
// behind it (object-position alone can't achieve this: moving the crop
// window over a full-height cover render doesn't change what fraction of
// that render the sign occupies — only cropping tighter does).
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
// Mobile's own native width is further reduced by its crop box below
// (556px, not the full 940px source width) for the same reason — the
// crop is what the "native resolution" ceiling is measured against for
// mobile, not the uncropped source.
const VARIANTS = {
  desktop: { file: "hero-desktop-source.png", widths: [1280, 1920, 2560] },
  // Extracted from hero-mobile-source.png (940x1672) before resizing —
  // see this file's own top comment for why. The box: left 121, top 560,
  // 556 wide, 1112 tall. Chosen so (a) the sign's own top edge (measured
  // ~row 619 in the source) keeps a little headroom rather than being
  // flush with the crop edge, (b) the crop's bottom edge lands exactly
  // on the source's own bottom edge (560+1112=1672) so none of the
  // counter/floor space below the window — the only real content
  // available for the "fade to solid" zone — goes to waste, and (c) the
  // crop's own aspect ratio (556:1112 = 1:2, close to a typical phone's
  // own ~0.46-0.56) means a browser's object-fit:cover at render time
  // only trims the sides a little rather than remapping the vertical
  // proportions again. Net effect: the sign/window band — ~37-82% of
  // the UNCROPPED source's height — lands at roughly 2-64% of THIS
  // crop's height, i.e. comfortably inside the upper portion the mobile
  // layout asks for, with its own bottom edge landing close to where
  // the CSS overlay's own fade-to-solid gradient starts (~62% from top /
  // 38% from bottom) — confirmed by rendering the crop and reading back
  // actual pixel positions, not just by this arithmetic alone.
  // 375 is an extra smaller tier added on top of the task's requested
  // 720/1080/1440 (see widthsToGenerate below) — the crop's own 556px
  // native width means none of those three requested widths actually
  // fit, so without a smaller tier mobile would ship exactly one size;
  // 375 gives low-DPR phones a lighter option instead of only the full
  // 556px variant.
  mobile: { file: "hero-mobile-source.png", widths: [375, 720, 1080, 1440], crop: { left: 121, top: 560, width: 556, height: 1112 } }
};

function widthsToGenerate(requested, nativeWidth) {
  const fitting = requested.filter((w) => w <= nativeWidth);
  if (fitting.length === requested.length) return fitting; // every requested width already fits
  return [...new Set([...fitting, nativeWidth])].sort((a, b) => a - b);
}

async function generateOne(buffer, width, outBasePath, crop) {
  const base = crop ? sharp(buffer).extract(crop) : sharp(buffer);
  const resized = base.resize({ width });
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

  for (const [key, { file, widths: requested, crop }] of Object.entries(VARIANTS)) {
    const srcPath = path.join(HERO_DIR, file);
    const buffer = await readFile(srcPath);
    const meta = await sharp(buffer).metadata();
    // The "native width" a requested width gets capped against is the
    // CROP's own width when there is one (mobile) — not the full source
    // width, since that's genuinely all the resolution this variant has
    // to work with once it's been cropped.
    const nativeWidth = crop ? crop.width : meta.width;

    const widths = widthsToGenerate(requested, nativeWidth);
    const skipped = requested.filter((w) => w > nativeWidth);
    if (skipped.length) {
      console.log(
        `[build-hero] ${key}: native usable width is ${nativeWidth}px${crop ? " (after cropping)" : ""} — skipping requested width(s) ${skipped.join(", ")} (would upscale) and generating the native width (${nativeWidth}px) instead`
      );
    }

    for (const width of widths) {
      const outBasePath = path.join(HERO_DIR, `hero-${key}`);
      const sizes = await generateOne(buffer, width, outBasePath, crop);
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
