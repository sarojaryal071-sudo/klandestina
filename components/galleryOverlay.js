// galleryOverlay.js
// The full-screen "See all N photos" destination opened from the teaser
// mosaic (galleryMosaic.js) — header + close, a sticky row of album pills
// (styled like the Full Menu's category pills), and a CSS-columns masonry
// grid of every photo, each one "developing" into color the first time it
// scrolls into view. Tapping a tile opens the single-photo lightbox
// (galleryPhotoViewer.js) at that photo's position within whatever's
// currently filtered in.
//
// Browser-back handling: opening this overlay pushes one history entry;
// the photo viewer (opened from inside it) pushes a second. A single
// popstate listener here closes whichever is currently open, innermost
// first — so Back (or Esc, which just calls history.back() too) closes
// the lightbox before the gallery, never both at once. See requestClose
// in galleryPhotoViewer.js: its own close triggers always go through
// history.back() rather than closing directly, so there's exactly one
// place (the popstate handler below) that actually hides either layer.

import { openGalleryPhotoViewer, closeGalleryPhotoViewer } from "./galleryPhotoViewer.js";

const DEVELOP_DURATION_MS = 900;

let allPhotos = []; // flat [{src, thumb, w, h, albumSlug, albumTitle}], album order then filename order
let activeFilter = "all";
let developObserver = null;
let labelsRef = null;
let lastFocusedEl = null;
let viewerOpen = false;

/**
 * @param {HTMLElement} container
 * @param {{albums: Object[], total: number}} galleryData
 * @param {Object} labels - see script.js's buildGalleryLabels()
 */
export function renderGalleryOverlay(container, galleryData, labels) {
  labelsRef = labels;
  allPhotos = flattenAlbums(galleryData.albums);

  const pillsHtml = [
    `<button type="button" class="tab gallery-pill gallery-pill--active" data-album="all">${labels.all} <span class="gallery-pill-count">${galleryData.total}</span></button>`,
    ...galleryData.albums.map(
      (a) => `<button type="button" class="tab gallery-pill" data-album="${a.slug}">${a.title} <span class="gallery-pill-count">${a.count}</span></button>`
    ),
  ].join("");

  container.innerHTML = `
    <div class="gallery-overlay" id="gallery-overlay" hidden role="dialog" aria-modal="true" aria-label="${labels.heading}">
      <div class="gallery-overlay-sticky">
        <div class="gallery-overlay-header">
          <h2>${labels.heading}</h2>
          <button type="button" class="gallery-overlay-close" aria-label="${labels.close}">&times;</button>
        </div>
        <div class="gallery-overlay-pills" id="gallery-overlay-pills">${pillsHtml}</div>
      </div>
      <div class="gallery-overlay-scroll">
        <div class="gallery-masonry" id="gallery-masonry">${renderTiles()}</div>
      </div>
    </div>
  `;

  const overlay = container.querySelector("#gallery-overlay");

  overlay.querySelector(".gallery-overlay-close").addEventListener("click", () => requestCloseOverlay());
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) requestCloseOverlay();
  });

  overlay.querySelectorAll(".gallery-pill").forEach((pill) => {
    pill.addEventListener("click", () => setFilter(pill.dataset.album));
  });

  overlay.querySelectorAll(".gallery-tile").forEach((tile) => {
    tile.addEventListener("click", () => openPhotoAt(Number(tile.dataset.photoIndex)));
  });

  document.addEventListener("keydown", (event) => {
    if (overlay.hidden || viewerOpen) return;
    if (event.key === "Escape") requestCloseOverlay();
  });

  window.addEventListener("popstate", () => {
    if (viewerOpen) {
      closeGalleryPhotoViewer();
      viewerOpen = false;
    } else if (!overlay.hidden) {
      hideOverlay(overlay);
    }
  });

  setUpDevelopObserver(overlay);
}

function flattenAlbums(albums) {
  const flat = [];
  albums.forEach((album) => {
    album.photos.forEach((photo) => {
      flat.push({ ...photo, albumSlug: album.slug, albumTitle: album.title });
    });
  });
  return flat;
}

function renderTiles() {
  return allPhotos
    .map((photo, i) => {
      const altLabel = labelsRef.altPhotoFn(photo.albumTitle, indexWithinAlbum(photo, i) + 1);
      return `
        <button
          type="button" class="gallery-tile" data-album="${photo.albumSlug}" data-photo-index="${i}"
          style="aspect-ratio:${photo.w} / ${photo.h}" aria-label="${altLabel}"
        >
          <img class="gallery-tile-img" src="${photo.thumb}" alt="" loading="lazy" decoding="async">
        </button>`;
    })
    .join("");
}

function indexWithinAlbum(photo, flatIndex) {
  let count = 0;
  for (let i = 0; i <= flatIndex; i++) {
    if (allPhotos[i].albumSlug === photo.albumSlug) count++;
  }
  return count - 1;
}

function setUpDevelopObserver(overlay) {
  if (!("IntersectionObserver" in window) || prefersReducedMotion()) {
    // No animation to run — every tile just starts in its final state
    // (see the .gallery-tile-img base rule in style.css, which only
    // applies the undeveloped filter inside a
    // @media (prefers-reduced-motion: no-preference) block).
    return;
  }
  developObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("gallery-tile-img--developed");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "50px", threshold: 0.1 }
  );
  overlay.querySelectorAll(".gallery-tile-img").forEach((img) => developObserver.observe(img));
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function setFilter(filter) {
  if (filter === activeFilter) return;
  activeFilter = filter;
  const overlay = document.getElementById("gallery-overlay");

  overlay.querySelectorAll(".gallery-pill").forEach((pill) => {
    pill.classList.toggle("gallery-pill--active", pill.dataset.album === filter);
  });

  const grid = overlay.querySelector("#gallery-masonry");
  grid.querySelectorAll(".gallery-tile").forEach((tile) => {
    const show = filter === "all" || tile.dataset.album === filter;
    tile.classList.toggle("gallery-tile--filtered-out", !show);
  });
}

function visiblePhotoEntries() {
  return allPhotos
    .map((photo, i) => ({ photo, i }))
    .filter(({ photo }) => activeFilter === "all" || photo.albumSlug === activeFilter);
}

function openPhotoAt(flatIndex) {
  const entries = visiblePhotoEntries();
  const startIndex = entries.findIndex((e) => e.i === flatIndex);
  const photos = entries.map((e) => e.photo);
  if (startIndex === -1 || photos.length === 0) return;

  viewerOpen = true;
  history.pushState({ galleryViewer: true }, "");
  openGalleryPhotoViewer({
    photos,
    startIndex,
    labels: labelsRef,
    onRequestClose: () => history.back(),
  });
}

export function openGalleryOverlay() {
  const overlay = document.getElementById("gallery-overlay");
  if (!overlay || !overlay.hidden) return;
  lastFocusedEl = document.activeElement;
  overlay.hidden = false;
  document.body.style.overflow = "hidden";
  history.pushState({ galleryOverlay: true }, "");
  overlay.querySelector(".gallery-overlay-close").focus();
}

function requestCloseOverlay() {
  history.back();
}

function hideOverlay(overlay) {
  overlay.hidden = true;
  document.body.style.overflow = "";
  if (lastFocusedEl && document.body.contains(lastFocusedEl)) lastFocusedEl.focus();
}

// Called by script.js on every language switch — updates the chrome
// text (header, close label, pill labels/titles) without tearing down
// and rebuilding the whole masonry grid, which would reset scroll
// position and re-run every tile's "developing" reveal for no reason.
export function refreshGalleryOverlayLabels(galleryData, labels) {
  labelsRef = labels;
  const overlay = document.getElementById("gallery-overlay");
  if (!overlay) return;
  overlay.setAttribute("aria-label", labels.heading);
  overlay.querySelector(".gallery-overlay-header h2").textContent = labels.heading;
  overlay.querySelector(".gallery-overlay-close").setAttribute("aria-label", labels.close);
  const pills = overlay.querySelectorAll(".gallery-pill");
  pills[0].childNodes[0].textContent = `${labels.all} `;
  galleryData.albums.forEach((a, i) => {
    pills[i + 1].childNodes[0].textContent = `${a.title} `;
  });
}
