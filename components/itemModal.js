// itemModal.js
// Click-to-expand detail modal shared by every menu item row (menuItem.js)
// and every signature dish card (dishCard.js) — one modal instance, one
// rendering path, opened with the same plain item shape
// ({ name, price, allergens, description }) regardless of which of the two
// list styles it was clicked from.
//
// Reuses the Special-Event-Inquiry modal's .modal-overlay/.modal-close
// treatment (style.css) for the close button and overlay/backdrop, so the
// two modals read as the same system rather than two different ones.

import { dishImagePath } from "./dishImage.js";
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

  // Same speculative-load-then-fallback approach as the thumbnails
  // (components/dishImage.js): try the derived filename, and if it 404s,
  // swap in a small stylized accent-glow placeholder (.item-modal-photo
  // itself already IS that placeholder's background — the fallback is
  // just letting it show through with nothing on top) rather than a
  // broken-image icon.
  const photoWrap = modal.querySelector("#item-modal-photo");
  photoWrap.classList.remove("item-modal-photo--empty");
  photoWrap.innerHTML = `
    <img
      src="${dishImagePath(item.name)}" alt="" loading="lazy"
      onerror="this.parentElement.classList.add('item-modal-photo--empty'); this.remove();"
    >
  `;

  modal.hidden = false;
  document.body.style.overflow = "hidden";
}

export function closeItemModal() {
  const modal = document.getElementById("item-modal");
  if (!modal) return;
  modal.hidden = true;
  document.body.style.overflow = "";
}
