// galleryMosaic.js
// The main-page teaser: one big tile (spans both rows) + two smaller
// tiles, each independently crossfading between two photos on a slow,
// staggered loop. A rotating sample, not the full set — "See all N
// photos" (or tapping any tile) opens the complete gallery overlay
// (galleryOverlay.js).

import { openGalleryOverlay } from "./galleryOverlay.js";

const CROSSFADE_INTERVAL_MS = 12000;
const STAGGER_MS = 4000; // each tile's own loop starts this much later than the previous tile's
const TILE_COUNT = 3;
const PHOTOS_NEEDED = TILE_COUNT * 2;

// Fisher-Yates — picks a genuinely random, non-repeating sample rather
// than just slicing the front of a shuffled-once array (which would bias
// toward whatever happened to sort first) or allowing the same photo to
// show in two tiles at once.
function sample(array, count) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

/**
 * @param {HTMLElement} container
 * @param {{albums: Object[], total: number}} galleryData - already language-resolved (album.title is a plain string)
 * @param {{seeAllPhotosFn: (count: number) => string}} labels
 */
export function renderGalleryMosaic(container, galleryData, labels) {
  const allPhotos = galleryData.albums.flatMap((a) => a.photos);
  const picked = sample(allPhotos, Math.min(PHOTOS_NEEDED, allPhotos.length));

  const tilesHtml = Array.from({ length: TILE_COUNT }, (_, i) => {
    const first = picked[(i * 2) % picked.length];
    const second = picked[(i * 2 + 1) % picked.length];
    const isBig = i === 0;
    const imgs = [first, second]
      .filter(Boolean)
      .map(
        (photo, j) => `
          <img
            class="mosaic-tile-img${j === 0 ? " mosaic-tile-img--active" : ""}"
            src="${photo.thumb}" alt="" loading="lazy" decoding="async"
          >`
      )
      .join("");
    return `<button type="button" class="mosaic-tile${isBig ? " mosaic-tile--big" : ""}" data-tile="${i}">${imgs}</button>`;
  }).join("");

  container.innerHTML = `
    <div class="gallery-mosaic reveal">${tilesHtml}</div>
    <div class="gallery-mosaic-cta reveal">
      <button type="button" class="btn btn-ghost" data-gallery-cta>${labels.seeAllPhotosFn(galleryData.total)}</button>
    </div>
  `;

  if (allPhotos.length === 0) return; // nothing to crossfade or open

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  container.querySelectorAll(".mosaic-tile").forEach((tile, i) => {
    tile.addEventListener("click", openGalleryOverlay);

    if (reduceMotion) return; // static photos, no crossfade loop

    const imgs = tile.querySelectorAll(".mosaic-tile-img");
    if (imgs.length < 2) return; // nothing to crossfade to (not enough gallery photos)

    let active = 0;
    function crossfade() {
      if (!document.body.contains(tile)) return; // language switch rebuilds the gallery section wholesale
      imgs[active].classList.remove("mosaic-tile-img--active");
      active = (active + 1) % imgs.length;
      imgs[active].classList.add("mosaic-tile-img--active");
    }

    // The stagger only delays when each tile's OWN interval starts, not an
    // immediate fade at page load — otherwise the first image would barely
    // be visible before flipping. Tile 0 still fades first (at 12s), tile 1
    // at 16s, tile 2 at 20s, and every CROSSFADE_INTERVAL_MS thereafter —
    // staggered, but nothing flips the instant the page loads.
    window.setTimeout(() => {
      setInterval(crossfade, CROSSFADE_INTERVAL_MS);
    }, i * STAGGER_MS);
  });

  container.querySelector("[data-gallery-cta]").addEventListener("click", openGalleryOverlay);
}

// Called on language switch — updates just the CTA button's text (the
// only translated string in the teaser; photos carry no language-bound
// text) without reshuffling/rebuilding the random photo sample.
export function refreshGalleryMosaicLabels(container, galleryData, labels) {
  const btn = container.querySelector("[data-gallery-cta]");
  if (btn) btn.textContent = labels.seeAllPhotosFn(galleryData.total);
}
