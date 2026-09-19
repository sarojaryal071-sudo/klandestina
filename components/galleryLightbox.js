// galleryLightbox.js
// The "See All Photos" destination — a full-screen modal grid of every
// photo in the gallery data set (the mosaic next to it only ever shows a
// rotating handful as a teaser). Same .modal-overlay/.modal-close system
// as the other two modals on the site (eventModal.js, itemModal.js), just
// with a much larger card sized to hold a scrollable photo grid instead of
// a form or a single dish.

/**
 * @param {HTMLElement} container
 * @param {Object[]} photos - the same gallery array from data/menu.json (each { image: "file.jpg" })
 */
export function renderGalleryLightbox(container, photos) {
  const tiles = photos
    .map(
      (photo) => `
        <div class="lightbox-tile">
          <img src="images/dishes/${photo.image}" alt="" loading="lazy" decoding="async">
        </div>`
    )
    .join("");

  container.innerHTML = `
    <div class="modal-overlay lightbox-overlay" id="gallery-lightbox" hidden>
      <div class="modal-card lightbox-card" role="dialog" aria-modal="true" aria-labelledby="gallery-lightbox-title">
        <button
          type="button" class="modal-close" aria-label="Close gallery"
          data-i18n-aria-label="gallery.lightboxCloseLabel" data-close-modal
        >&times;</button>
        <h3 id="gallery-lightbox-title" data-i18n="gallery.heading">The room</h3>
        <div class="lightbox-grid">${tiles}</div>
      </div>
    </div>
  `;

  const modal = container.querySelector("#gallery-lightbox");

  modal.addEventListener("click", (event) => {
    if (event.target === modal || event.target.closest("[data-close-modal]")) closeGalleryLightbox();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closeGalleryLightbox();
  });
}

export function openGalleryLightbox() {
  const modal = document.getElementById("gallery-lightbox");
  if (!modal) return;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
}

export function closeGalleryLightbox() {
  const modal = document.getElementById("gallery-lightbox");
  if (!modal) return;
  modal.hidden = true;
  document.body.style.overflow = "";
}
