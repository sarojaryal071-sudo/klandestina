// itemModal.js
// Click-to-expand detail modal shared by every menu item row (menuItem.js)
// and every signature dish card (dishCard.js) — one modal instance, one
// rendering path, opened with the same plain item shape
// ({ name, price, allergens, description, image, images }) regardless of
// which of the two list styles it was clicked from.
//
// Reuses the Special-Event-Inquiry modal's .modal-overlay/.modal-close
// treatment (style.css) for the close button and overlay/backdrop, so the
// two modals read as the same system rather than two different ones.

import { renderPrice } from "./priceDisplay.js";

export function renderItemModal(container) {
  container.innerHTML = `
    <div class="modal-overlay item-modal-overlay" id="item-modal" hidden>
      <div class="modal-card item-modal-card" role="dialog" aria-modal="true" aria-labelledby="item-modal-title">
        <button
          type="button" class="modal-close item-modal-close" aria-label="Close"
          data-i18n-aria-label="itemModal.closeLabel" data-close-modal
        >&times;</button>
        <div class="item-modal-photo" id="item-modal-photo"></div>
        <div class="item-modal-thumbs" id="item-modal-thumbs" hidden></div>
        <div class="item-modal-body">
          <div class="item-modal-top">
            <h3 id="item-modal-title"></h3>
            <span class="menu-item-tag" id="item-modal-tag" hidden></span>
          </div>
          <p class="item-modal-desc" id="item-modal-desc" hidden></p>
          <div id="item-modal-price"></div>
        </div>
      </div>
    </div>
  `;

  const modal = container.querySelector("#item-modal");

  modal.addEventListener("click", (event) => {
    if (event.target === modal || event.target.closest("[data-close-modal]")) closeItemModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closeItemModal();
  });
}

/**
 * @param {Object} item
 * @param {string} item.name
 * @param {string[]} [item.allergens]
 * @param {string} item.description  - already resolved to the active language's plain string
 * @param {string|Object} item.price - same shape renderMenuItem's price accepts (plain string, "", or a wine object)
 * @param {string} [item.image]      - filename inside images/dishes/, used when item.images isn't set
 * @param {string[]} [item.images]   - optional multi-photo set for the gallery; falls back to [item.image]
 */
export function openItemModal(item) {
  const modal = document.getElementById("item-modal");
  if (!modal) return;

  modal.querySelector("#item-modal-title").textContent = item.name;

  const tagEl = modal.querySelector("#item-modal-tag");
  const allergenLabel = item.allergens && item.allergens.length ? item.allergens.join(" · ") : "";
  tagEl.textContent = allergenLabel;
  tagEl.hidden = !allergenLabel;

  const descEl = modal.querySelector("#item-modal-desc");
  descEl.textContent = item.description || "";
  descEl.hidden = !item.description;

  modal.querySelector("#item-modal-price").innerHTML = renderPrice(item.price);

  const images = item.images && item.images.length ? item.images : item.image ? [item.image] : [];
  renderGallery(modal, images);

  modal.hidden = false;
  document.body.style.overflow = "hidden";
}

// A large primary photo, plus — only when the item actually has more than
// one — a small tappable thumbnail strip underneath it to browse the rest
// (a signature dish like Quesabirria has both quesabirria.jpg and
// quesabirria-2.jpg via its "images" array in data/menu.json; most items
// still just have a single "image" and never show a strip at all). No
// matching photo at all falls back to a small stylized accent-glow strip
// instead of a broken-image icon.
function renderGallery(modal, images) {
  const photoWrap = modal.querySelector("#item-modal-photo");
  const thumbsWrap = modal.querySelector("#item-modal-thumbs");

  if (images.length === 0) {
    photoWrap.className = "item-modal-photo item-modal-photo--empty";
    photoWrap.innerHTML = "";
    thumbsWrap.hidden = true;
    thumbsWrap.innerHTML = "";
    return;
  }

  photoWrap.className = "item-modal-photo";
  const setPrimary = (file) => {
    photoWrap.innerHTML = `
      <img
        src="images/dishes/${file}" alt="" loading="lazy"
        onerror="this.parentElement.classList.add('item-modal-photo--empty'); this.remove();"
      >`;
  };
  setPrimary(images[0]);

  if (images.length > 1) {
    thumbsWrap.hidden = false;
    thumbsWrap.innerHTML = images
      .map(
        (file, i) => `
          <button
            type="button" class="item-modal-thumb${i === 0 ? " item-modal-thumb--active" : ""}"
            data-file="${file}" aria-label="Photo ${i + 1}"
          >
            <img src="images/dishes/${file}" alt="" loading="lazy">
          </button>`
      )
      .join("");

    thumbsWrap.querySelectorAll(".item-modal-thumb").forEach((thumbBtn) => {
      thumbBtn.addEventListener("click", () => {
        thumbsWrap.querySelectorAll(".item-modal-thumb").forEach((el) => el.classList.remove("item-modal-thumb--active"));
        thumbBtn.classList.add("item-modal-thumb--active");
        photoWrap.className = "item-modal-photo";
        setPrimary(thumbBtn.dataset.file);
      });
    });
  } else {
    thumbsWrap.hidden = true;
    thumbsWrap.innerHTML = "";
  }
}

export function closeItemModal() {
  const modal = document.getElementById("item-modal");
  if (!modal) return;
  modal.hidden = true;
  document.body.style.overflow = "";
}
