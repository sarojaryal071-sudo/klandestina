// galleryPhotoViewer.js
// The single-photo lightbox opened from inside the full gallery overlay
// (galleryOverlay.js) — full-size photo, an ambient blurred-glow backdrop
// built from the photo itself, prev/next navigation (click, keyboard,
// swipe), a desktop-only filmstrip, and the same "developing" reveal the
// masonry grid uses, just shorter. This module owns nothing about albums
// or filtering — it's handed a flat, already-filtered list of photos and
// a starting index, and knows only how to move through that list.

let photos = [];
let index = 0;
let onRequestCloseCallback = null;
let lastFocusedEl = null;
let touchStartX = null;
let touchStartY = null;
let activeGlowLayer = "a";

export function renderGalleryPhotoViewer(container, labels) {
  container.innerHTML = `
    <div class="gallery-viewer" id="gallery-viewer" hidden role="dialog" aria-modal="true" aria-label="${labels.closeGallery}">
      <div class="gallery-viewer-glow" aria-hidden="true">
        <div class="gallery-viewer-glow-img gallery-viewer-glow-img--a"></div>
        <div class="gallery-viewer-glow-img gallery-viewer-glow-img--b"></div>
      </div>
      <button type="button" class="gallery-viewer-close" aria-label="${labels.close}">&times;</button>
      <button type="button" class="gallery-viewer-arrow gallery-viewer-arrow--prev" aria-label="${labels.previous}">&lsaquo;</button>
      <button type="button" class="gallery-viewer-arrow gallery-viewer-arrow--next" aria-label="${labels.next}">&rsaquo;</button>
      <div class="gallery-viewer-stage">
        <img class="gallery-viewer-img" id="gallery-viewer-img" alt="">
      </div>
      <div class="gallery-viewer-meta">
        <span class="gallery-viewer-album" id="gallery-viewer-album"></span>
        <span class="gallery-viewer-counter" id="gallery-viewer-counter"></span>
      </div>
      <div class="gallery-viewer-filmstrip" id="gallery-viewer-filmstrip"></div>
    </div>
  `;

  const viewer = container.querySelector("#gallery-viewer");

  viewer.querySelector(".gallery-viewer-close").addEventListener("click", () => requestClose());
  viewer.querySelector(".gallery-viewer-arrow--prev").addEventListener("click", () => step(-1));
  viewer.querySelector(".gallery-viewer-arrow--next").addEventListener("click", () => step(1));

  // Clicking the stage background (not the photo itself) closes, same
  // "click the backdrop to dismiss" convention as every other overlay
  // on the site.
  viewer.addEventListener("click", (event) => {
    if (event.target === viewer || event.target.classList.contains("gallery-viewer-stage")) requestClose();
  });

  document.addEventListener("keydown", (event) => {
    if (viewer.hidden) return;
    if (event.key === "Escape") requestClose();
    else if (event.key === "ArrowLeft") step(-1);
    else if (event.key === "ArrowRight") step(1);
    else if (event.key === "Tab") trapFocus(event, viewer);
  });

  viewer.addEventListener("touchstart", (event) => {
    const t = event.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }, { passive: true });

  viewer.addEventListener("touchend", (event) => {
    if (touchStartX === null) return;
    const t = event.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    touchStartX = null;
    touchStartY = null;
    const SWIPE_THRESHOLD = 50;
    if (Math.abs(dy) > Math.abs(dx) && dy > SWIPE_THRESHOLD) {
      requestClose(); // swipe down
    } else if (Math.abs(dx) > SWIPE_THRESHOLD) {
      step(dx < 0 ? 1 : -1); // swipe left = next, swipe right = prev
    }
  }, { passive: true });
}

function trapFocus(event, viewer) {
  const focusable = viewer.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])');
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * @param {Object} opts
 * @param {Object[]} opts.photos - flat, pre-filtered [{src, thumb, w, h, albumTitle}]
 * @param {number} opts.startIndex
 * @param {Object} opts.labels - {photoCounter, photoOfTotal, altPhoto} i18n templates, {current}/{total}/{album}/{n} placeholders
 * @param {() => void} opts.onRequestClose - called when the viewer wants to close (the caller owns history/back)
 */
export function openGalleryPhotoViewer({ photos: list, startIndex, labels, onRequestClose }) {
  const viewer = document.getElementById("gallery-viewer");
  if (!viewer || list.length === 0) return;

  photos = list;
  index = startIndex;
  onRequestCloseCallback = onRequestClose;
  lastFocusedEl = document.activeElement;

  buildFilmstrip(viewer);
  renderCurrent(viewer, labels);

  viewer.hidden = false;
  // No document.body.style.overflow here — this viewer only ever opens
  // from inside the gallery overlay (galleryOverlay.js), which already
  // owns the body scroll lock for the whole gallery experience. Setting
  // and clearing it here too would un-lock the body the moment the
  // viewer closes even though the overlay is still open behind it.
  viewer.querySelector(".gallery-viewer-close").focus();
}

export function closeGalleryPhotoViewer() {
  const viewer = document.getElementById("gallery-viewer");
  if (!viewer || viewer.hidden) return;
  viewer.hidden = true;
  if (lastFocusedEl && document.body.contains(lastFocusedEl)) lastFocusedEl.focus();
}

function requestClose() {
  if (onRequestCloseCallback) onRequestCloseCallback();
}

function step(direction) {
  if (photos.length <= 1) return;
  index = (index + direction + photos.length) % photos.length;
  const viewer = document.getElementById("gallery-viewer");
  renderCurrent(viewer, currentLabels);
}

let currentLabels = null;

function renderCurrent(viewer, labels) {
  currentLabels = labels;
  const photo = photos[index];
  const img = viewer.querySelector("#gallery-viewer-img");
  const altText = labels.altPhotoFn(photo.albumTitle, index + 1);

  img.src = photo.src;
  img.alt = altText;
  img.width = photo.w;
  img.height = photo.h;

  // Restart the "developing" animation on every photo change by forcing
  // a reflow between removing and re-adding the class — the browser
  // won't replay a CSS animation just because its class got re-added in
  // the same tick, it needs a layout read in between to notice the
  // class was ever removed.
  img.classList.remove("gallery-viewer-img--developing");
  void img.offsetWidth;
  img.classList.add("gallery-viewer-img--developing");

  viewer.querySelector("#gallery-viewer-album").textContent = photo.albumTitle;
  viewer.querySelector("#gallery-viewer-counter").textContent = labels.counterFn(index + 1, photos.length);
  viewer.setAttribute("aria-label", labels.ofTotalFn(index + 1, photos.length));

  updateGlow(viewer, photo.src);
  updateFilmstripActive(viewer);
  preload(index + 1);
  preload(index - 1);

  const single = photos.length <= 1;
  viewer.querySelector(".gallery-viewer-arrow--prev").hidden = single;
  viewer.querySelector(".gallery-viewer-arrow--next").hidden = single;
}

function preload(i) {
  const photo = photos[(i + photos.length) % photos.length];
  if (!photo) return;
  const img = new Image();
  img.src = photo.src;
}

// Two stacked, absolutely positioned blurred copies of the photo —
// identical crossfade trick the dish carousel/menu photo rotator use
// elsewhere, just driving background-image + opacity instead of two
// <img> elements, since this one needs heavy blur/saturate/darken
// filters applied uniformly rather than per-element state.
function updateGlow(viewer, src) {
  const nextLayer = activeGlowLayer === "a" ? "b" : "a";
  const incoming = viewer.querySelector(`.gallery-viewer-glow-img--${nextLayer}`);
  const outgoing = viewer.querySelector(`.gallery-viewer-glow-img--${activeGlowLayer}`);
  incoming.style.backgroundImage = `url("${src}")`;
  incoming.classList.add("gallery-viewer-glow-img--active");
  outgoing.classList.remove("gallery-viewer-glow-img--active");
  activeGlowLayer = nextLayer;
}

function buildFilmstrip(viewer) {
  const strip = viewer.querySelector("#gallery-viewer-filmstrip");
  if (photos.length <= 1) {
    strip.hidden = true;
    strip.innerHTML = "";
    return;
  }
  strip.hidden = false;
  strip.innerHTML = photos
    .map(
      (photo, i) => `
        <button type="button" class="gallery-viewer-thumb" data-index="${i}" aria-label="${i + 1}">
          <img src="${photo.thumb}" alt="" loading="lazy" decoding="async">
        </button>`
    )
    .join("");
  strip.querySelectorAll(".gallery-viewer-thumb").forEach((btn) => {
    btn.addEventListener("click", () => {
      index = Number(btn.dataset.index);
      renderCurrent(viewer, currentLabels);
    });
  });
}

function updateFilmstripActive(viewer) {
  const strip = viewer.querySelector("#gallery-viewer-filmstrip");
  strip.querySelectorAll(".gallery-viewer-thumb").forEach((btn, i) => {
    const active = i === index;
    btn.classList.toggle("gallery-viewer-thumb--active", active);
    if (active) btn.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  });
}
