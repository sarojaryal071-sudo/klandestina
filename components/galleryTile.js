// galleryTile.js
// One universal tile design for the gallery grid. Given one photo, returns
// its tile (gradient scrim + optional caption, tilt-on-hover via CSS).

/**
 * @param {Object} photo
 * @param {string} photo.image   - filename inside images/dishes/ (the gallery has no photos
 *                                  of its own yet, so it reuses the existing dish shots as filler —
 *                                  see the README's "Known gaps" section)
 * @param {string} [photo.caption]
 * @returns {HTMLElement}
 */
export function renderGalleryTile(photo) {
  const frame = document.createElement("div");
  frame.className = "tilt-frame reveal";

  frame.innerHTML = `
    <div class="visual tilt-card">
      <img class="visual-img" src="images/dishes/${photo.image}" alt="" loading="lazy" decoding="async">
      <div class="scrim"></div>
      ${photo.caption ? `<div class="caption"><p>${photo.caption}</p></div>` : ""}
    </div>
  `;

  return frame;
}
