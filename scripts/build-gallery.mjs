#!/usr/bin/env node
// build-gallery.mjs
//
// Scans images/gallery/<NN-album-name>/ folders, optimizes photos in place
// (auto-orient + strip all metadata, fit within 2000px long edge), writes
// matching thumbnails to images/gallery-thumbs/<album>/, and writes
// data/gallery.json describing the result. The site itself never runs
// this — it just reads data/gallery.json — so this script is the only
// thing standing between "drag photos into a folder on github.com" and a
// working gallery: run manually (`node scripts/build-gallery.mjs`, after
// `npm i --no-save sharp` in this directory) or via
// .github/workflows/gallery.yml on every push that touches images/gallery/**.
//
// Idempotent by design: a second run against already-optimized photos
// makes zero changes (see shouldOptimize below), so the Action's
// "commit only if something changed" check is meaningful rather than
// recompressing (and silently degrading) every photo on every run.

import { readdir, readFile, writeFile, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const GALLERY_DIR = path.join(ROOT, "images", "gallery");
const THUMBS_DIR = path.join(ROOT, "images", "gallery-thumbs");
const DATA_PATH = path.join(ROOT, "data", "gallery.json");

const ACCEPTED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const LONG_EDGE_FULL = 2000;
const LONG_EDGE_THUMB = 900;
const JPEG_QUALITY_FULL = 82;
const WEBP_QUALITY_FULL = 82;
const JPEG_QUALITY_THUMB = 75;
const WEBP_QUALITY_THUMB = 75;

// "01-summer" -> "Summer"; "04-food-and-drinks" -> "Food & Drinks". The
// numeric prefix sets display order (see buildAlbums) and is stripped
// here since it's not part of the title; "and" becomes "&" specifically
// (not every instance of the substring "and", just the whole-word case)
// so a hypothetical "grand-opening" folder doesn't get mangled into
// "Gr& Opening".
function titleFromFolderName(folderName) {
  const withoutPrefix = folderName.replace(/^\d+-/, "");
  const words = withoutPrefix.split("-").filter(Boolean);
  return words
    .map((w) => (w.toLowerCase() === "and" ? "&" : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");
}

// Natural sort so "IMG_2.jpg" sorts before "IMG_10.jpg" instead of after
// it (plain string comparison treats "1" < "2" character-by-character,
// which puts "10" before "2") — splits each name into alternating
// text/number runs and compares number runs numerically.
function naturalCompare(a, b) {
  const chunk = (s) => s.match(/\d+|\D+/g) || [];
  const ca = chunk(a);
  const cb = chunk(b);
  for (let i = 0; i < Math.max(ca.length, cb.length); i++) {
    const x = ca[i] ?? "";
    const y = cb[i] ?? "";
    if (x === y) continue;
    const nx = Number(x);
    const ny = Number(y);
    if (!Number.isNaN(nx) && !Number.isNaN(ny)) return nx - ny;
    return x < y ? -1 : 1;
  }
  return 0;
}

function albumOrderKey(folderName) {
  const match = folderName.match(/^(\d+)-/);
  return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
}

async function listAlbumFolders() {
  const entries = await readdir(GALLERY_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort((a, b) => albumOrderKey(a) - albumOrderKey(b) || a.localeCompare(b));
}

async function listPhotoFiles(albumDir) {
  const entries = await readdir(albumDir, { withFileTypes: true });
  const accepted = [];
  for (const e of entries) {
    if (!e.isFile()) continue;
    const ext = path.extname(e.name).toLowerCase();
    if (e.name.startsWith(".") || e.name === "album.json") continue;
    if (ACCEPTED_EXT.has(ext)) {
      accepted.push(e.name);
    } else if (ext) {
      console.warn(`[build-gallery] skipping unsupported file type: ${path.join(albumDir, e.name)} (HEIC and other formats aren't supported — convert to jpg/png/webp first)`);
    }
  }
  return accepted.sort(naturalCompare);
}

function encoderFor(ext, quality) {
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return (img) => img.jpeg({ quality, mozjpeg: true });
    case ".webp":
      return (img) => img.webp({ quality });
    case ".png":
      return (img) => img.png({ compressionLevel: 9, effort: 10 });
    default:
      throw new Error(`unreachable: unsupported ext ${ext}`);
  }
}

async function shouldOptimize(filePath) {
  const meta = await sharp(filePath).metadata();
  const longEdge = Math.max(meta.width || 0, meta.height || 0);
  const hasExif = Boolean(meta.exif);
  return { optimize: longEdge > LONG_EDGE_FULL || hasExif, meta };
}

// Re-encodes in place at <=2000px long edge, auto-oriented, metadata
// stripped (sharp drops all input metadata by default unless you
// explicitly call .withMetadata() — not calling it is what strips EXIF,
// including GPS, here). Returns the final {width, height} so the caller
// doesn't need a second metadata read.
async function optimizeFull(filePath, ext) {
  const buffer = await readFile(filePath);
  const encode = encoderFor(ext, ext === ".webp" ? WEBP_QUALITY_FULL : JPEG_QUALITY_FULL);
  let img = sharp(buffer).rotate().resize({ width: LONG_EDGE_FULL, height: LONG_EDGE_FULL, fit: "inside", withoutEnlargement: true });
  img = encode(img);
  const out = await img.toBuffer({ resolveWithObject: true });
  await writeFile(filePath, out.data);
  return { width: out.info.width, height: out.info.height };
}

async function writeThumb(srcPath, thumbPath, ext) {
  const buffer = await readFile(srcPath);
  const encode = encoderFor(ext, ext === ".webp" ? WEBP_QUALITY_THUMB : JPEG_QUALITY_THUMB);
  let img = sharp(buffer).rotate().resize({ width: LONG_EDGE_THUMB, height: LONG_EDGE_THUMB, fit: "inside", withoutEnlargement: true });
  img = encode(img);
  await mkdir(path.dirname(thumbPath), { recursive: true });
  await img.toFile(thumbPath);
}

async function fileExists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function processAlbum(folderName) {
  const albumDir = path.join(GALLERY_DIR, folderName);
  const thumbAlbumDir = path.join(THUMBS_DIR, folderName);
  const albumJsonPath = path.join(albumDir, "album.json");

  let title = { en: titleFromFolderName(folderName), fi: titleFromFolderName(folderName) };
  if (await fileExists(albumJsonPath)) {
    try {
      const parsed = JSON.parse(await readFile(albumJsonPath, "utf8"));
      if (parsed.title && parsed.title.en) {
        title = { en: parsed.title.en, fi: parsed.title.fi || parsed.title.en };
      }
    } catch (e) {
      console.warn(`[build-gallery] couldn't parse ${albumJsonPath}, falling back to the folder name: ${e.message}`);
    }
  }

  const files = await listPhotoFiles(albumDir);
  const photos = [];

  for (const file of files) {
    const filePath = path.join(albumDir, file);
    const ext = path.extname(file).toLowerCase();
    const thumbPath = path.join(thumbAlbumDir, file);

    const { optimize, meta } = await shouldOptimize(filePath);
    let width = meta.width;
    let height = meta.height;
    // EXIF orientation 5-8 swap width/height once rotated upright —
    // account for that even when the file isn't being re-optimized this
    // run, so an already-optimized-but-still-rotated photo (shouldn't
    // happen after a real run, but defends against a hand-placed file)
    // doesn't report swapped dimensions.
    if (meta.orientation && meta.orientation >= 5 && meta.orientation <= 8) {
      [width, height] = [height, width];
    }

    if (optimize) {
      const result = await optimizeFull(filePath, ext);
      width = result.width;
      height = result.height;
      console.log(`[build-gallery] optimized ${path.relative(ROOT, filePath)} -> ${width}x${height}`);
    }

    if (optimize || !(await fileExists(thumbPath))) {
      await writeThumb(filePath, thumbPath, ext);
      console.log(`[build-gallery] thumbnail ${path.relative(ROOT, thumbPath)}`);
    }

    photos.push({ src: `images/gallery/${folderName}/${file}`, thumb: `images/gallery-thumbs/${folderName}/${file}`, w: width, h: height });
  }

  // Delete thumbnails whose original photo is gone — otherwise a removed
  // photo leaves a stale, unreferenced file behind forever.
  if (await fileExists(thumbAlbumDir)) {
    const thumbFiles = await readdir(thumbAlbumDir);
    const currentNames = new Set(files);
    for (const tf of thumbFiles) {
      if (!currentNames.has(tf)) {
        await rm(path.join(thumbAlbumDir, tf));
        console.log(`[build-gallery] removed orphaned thumbnail images/gallery-thumbs/${folderName}/${tf}`);
      }
    }
    if (files.length === 0) {
      await rm(thumbAlbumDir, { recursive: true, force: true });
    }
  }

  return { slug: folderName, title, count: photos.length, photos };
}

async function removeOrphanedThumbAlbums(albumFolders) {
  if (!(await fileExists(THUMBS_DIR))) return;
  const thumbAlbums = await readdir(THUMBS_DIR, { withFileTypes: true });
  const current = new Set(albumFolders);
  for (const t of thumbAlbums) {
    if (t.isDirectory() && !current.has(t.name)) {
      await rm(path.join(THUMBS_DIR, t.name), { recursive: true, force: true });
      console.log(`[build-gallery] removed orphaned thumbnail album images/gallery-thumbs/${t.name}`);
    }
  }
}

async function main() {
  const albumFolders = await listAlbumFolders();
  const allAlbums = [];
  for (const folderName of albumFolders) {
    allAlbums.push(await processAlbum(folderName));
  }
  await removeOrphanedThumbAlbums(albumFolders);

  // Albums with no photos are left out entirely — "automatically hidden
  // from the album pills" per the README, simplest to guarantee by just
  // not shipping them in the data the UI reads, rather than shipping an
  // empty album and relying on every UI surface to remember to filter it.
  const albums = allAlbums.filter((a) => a.count > 0);
  const total = albums.reduce((sum, a) => sum + a.count, 0);

  const payload = { albums, total };
  await mkdir(path.dirname(DATA_PATH), { recursive: true });
  await writeFile(DATA_PATH, JSON.stringify(payload, null, 2) + "\n");
  console.log(`[build-gallery] wrote data/gallery.json — ${albums.length} album(s), ${total} photo(s) total`);
}

main().catch((err) => {
  console.error("[build-gallery] failed:", err);
  process.exit(1);
});
