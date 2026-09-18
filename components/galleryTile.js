// galleryTile.js
// One universal tile design for the gallery grid. Given one photo, returns
// its tile (gradient scrim + optional caption, tilt-on-hover via CSS).

/**
 * @param {Object} photo
 * @param {string} photo.image   - filename inside images/gallery/
 * @param {string} [photo.caption]
 * @returns {HTMLElement}
 */
export function renderGalleryTile(photo) {
  const frame = document.createElement("div");
  frame.className = "tilt-frame reveal";

  frame.innerHTML = `
    <div class="visual tilt-card" style="background-image:url('images/gallery/${photo.image}')">
      <div class="scrim"></div>
      ${photo.caption ? `<div class="caption"><p>${photo.caption}</p></div>` : ""}
    </div>
  `;

  return frame;
}
