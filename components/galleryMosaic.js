// galleryMosaic.js
// Replaces the old scattered/tilted scrapbook gallery with a compact,
// clean-rectangle mosaic: one big tile (spanning both rows) plus two
// smaller tiles stacked beside it, each independently crossfading between
// two photos from the same gallery data source on a slow, staggered loop.
// It's a rotating teaser, not the full set — "See All Photos" below it
// opens the complete grid (components/galleryLightbox.js).

import { openGalleryLightbox } from "./galleryLightbox.js";

const CROSSFADE_INTERVAL_MS = 12000;
const STAGGER_MS = 4000; // each tile's own loop starts this much later than the previous tile's
const TILE_COUNT = 3;

/**
 * @param {HTMLElement} container
 * @param {Object[]} photos - the gallery array from data/menu.json (each { image: "file.jpg" })
 */
export function renderGalleryMosaic(container, photos) {
  const tilesHtml = Array.from({ length: TILE_COUNT }, (_, i) => {
    const first = photos[(i * 2) % photos.length];
    const second = photos[(i * 2 + 1) % photos.length];
    const isBig = i === 0;
    const imgs = [first, second]
      .filter(Boolean)
      .map(
        (photo, j) => `
          <img
            class="mosaic-tile-img${j === 0 ? " mosaic-tile-img--active" : ""}"
            src="images/dishes/${photo.image}" alt="" loading="lazy" decoding="async"
          >`
      )
      .join("");
    return `<div class="mosaic-tile${isBig ? " mosaic-tile--big" : ""}" data-tile="${i}">${imgs}</div>`;
  }).join("");

  container.innerHTML = `
    <div class="gallery-mosaic reveal">${tilesHtml}</div>
    <div class="gallery-mosaic-cta reveal">
      <button type="button" class="btn btn-ghost" data-i18n="gallery.seeAllPhotos">See All Photos</button>
    </div>
  `;

  container.querySelectorAll(".mosaic-tile").forEach((tile, i) => {
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

  container
    .querySelector(".gallery-mosaic-cta .btn")
    .addEventListener("click", openGalleryLightbox);
}
