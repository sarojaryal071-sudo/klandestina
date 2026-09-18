// menuItem.js
// One universal row design for the full menu list. Given one menu entry,
// returns its row. Used in a loop for every item in the active category.

/**
 * @param {Object} item
 * @param {string} item.name
 * @param {string} item.tag          - e.g. "V", "GF", "" (empty allowed)
 * @param {string} item.description  - resolved to the active language's plain string by the caller
 * @param {string} item.price
 * @param {string} [item.image]      - filename inside images/dishes/; omitted items get a placeholder thumb
 * @returns {HTMLElement}
 */
export function renderMenuItem(item) {
  const row = document.createElement("div");
  row.className = "menu-item";

  const thumb = item.image
    ? `<img class="menu-item-thumb" src="images/dishes/${item.image}" alt="" loading="lazy">`
    : `<span class="menu-item-thumb menu-item-thumb--placeholder" aria-hidden="true"></span>`;

  row.innerHTML = `
    ${thumb}
    <div class="menu-item-body">
      <div class="menu-item-top">
        <span class="menu-item-name">${item.name}</span>
        ${item.tag ? `<span class="menu-item-tag">${item.tag}</span>` : ""}
      </div>
      <div class="menu-item-desc">${item.description}</div>
    </div>
    <div class="menu-item-price">${item.price}</div>
  `;

  return row;
}
