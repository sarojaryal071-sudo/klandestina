// menuItem.js
// One universal row design for the full menu list. Given one menu entry,
// returns its row. Used in a loop for every item in the active category.
//
// Layout is name-on-its-own-line, then description, then price — always
// stacked in that order rather than name/price sharing a row — so a long
// name (or wine's four-column price grid) never fights anything else for
// horizontal space or ends up vertically misaligned against wrapped text.
// A thumbnail only renders when the item actually has a real photo
// (item.image set); items without one skip the image area entirely rather
// than showing a placeholder square, since a blank tinted box reads as a
// broken image rather than an intentional choice. Clicking (or Enter/Space
// on) a row opens the shared item detail modal (itemModal.js) with the
// same data this row already has, larger photo included.

import { openItemModal } from "./itemModal.js";
import { renderPrice } from "./priceDisplay.js";

/**
 * @param {Object} item
 * @param {string} item.name
 * @param {string[]} [item.allergens]  - raw codes as printed (e.g. ["M","G"], ["VEGAN"]); plain display only
 * @param {string} item.description    - resolved to the active language's plain string by the caller; "" is allowed
 * @param {string|Object} item.price   - a plain string ("€15"), "" (no individual price — see a category note
 *                                        instead, e.g. lunch), or a wine-style object
 *                                        { glass12, glass16, glass24, bottle } with null for sizes not offered
 * @param {string} [item.image]        - filename inside images/dishes/; items without one render text-only
 * @param {string[]} [item.images]     - optional extra photos for the detail modal's gallery; falls back to [item.image]
 * @returns {HTMLElement}
 */
export function renderMenuItem(item) {
  const row = document.createElement("div");
  const hasPhoto = Boolean(item.image);
  const isWine = typeof item.price === "object" && item.price !== null;
  row.className = ["menu-item", !hasPhoto && "menu-item--no-photo", isWine && "menu-item--wine"].filter(Boolean).join(" ");
  row.tabIndex = 0;
  row.setAttribute("role", "button");
  row.setAttribute("aria-label", item.name);

  const thumb = hasPhoto ? `<img class="menu-item-thumb" src="images/dishes/${item.image}" alt="" loading="lazy">` : "";
  const allergenLabel = item.allergens && item.allergens.length ? item.allergens.join(" · ") : "";

  row.innerHTML = `
    ${thumb}
    <div class="menu-item-body">
      <div class="menu-item-top">
        <span class="menu-item-name">${item.name}</span>
        ${allergenLabel ? `<span class="menu-item-tag">${allergenLabel}</span>` : ""}
      </div>
      ${item.description ? `<div class="menu-item-desc">${item.description}</div>` : ""}
      ${renderPrice(item.price)}
    </div>
  `;

  row.addEventListener("click", () => openItemModal(item));
  row.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openItemModal(item);
    }
  });

  return row;
}
