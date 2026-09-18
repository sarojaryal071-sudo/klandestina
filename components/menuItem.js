// menuItem.js
// One universal row design for the full menu list. Given one menu entry,
// returns its row. Used in a loop for every item in the active category.

const WINE_SIZES = [
  { key: "glass12", label: "12cl" },
  { key: "glass16", label: "16cl" },
  { key: "glass24", label: "24cl" },
  { key: "bottle", label: "Btl" }
];

/**
 * @param {Object} item
 * @param {string} item.name
 * @param {string[]} [item.allergens]  - raw codes as printed (e.g. ["M","G"], ["VEGAN"]); plain display only
 * @param {string} item.description    - resolved to the active language's plain string by the caller; "" is allowed
 * @param {string|Object} item.price   - a plain string ("€15"), "" (no individual price — see a category note
 *                                        instead, e.g. lunch), or a wine-style object
 *                                        { glass12, glass16, glass24, bottle } with null for sizes not offered
 * @param {string} [item.image]        - filename inside images/dishes/; omitted items get a placeholder thumb
 * @returns {HTMLElement}
 */
export function renderMenuItem(item) {
  const row = document.createElement("div");
  row.className = "menu-item";

  const thumb = item.image
    ? `<img class="menu-item-thumb" src="images/dishes/${item.image}" alt="" loading="lazy">`
    : `<span class="menu-item-thumb menu-item-thumb--placeholder" aria-hidden="true"></span>`;

  const allergenLabel = item.allergens && item.allergens.length ? item.allergens.join(" · ") : "";

  row.innerHTML = `
    ${thumb}
    <div class="menu-item-body">
      <div class="menu-item-top">
        <span class="menu-item-name">${item.name}</span>
        ${allergenLabel ? `<span class="menu-item-tag">${allergenLabel}</span>` : ""}
      </div>
      ${item.description ? `<div class="menu-item-desc">${item.description}</div>` : ""}
    </div>
    ${renderPrice(item.price)}
  `;

  return row;
}

// A price is either a plain string, empty (nothing to show — the category
// note above covers it, e.g. Lunch's fixed price), or a wine-style object
// with up to four sizes. Purely displayed text either way, never clickable.
function renderPrice(price) {
  if (!price) return "";

  if (typeof price === "object") {
    const cols = WINE_SIZES.map(
      ({ key, label }) => `
        <div class="price-col">
          <span class="price-label">${label}</span>
          <span class="price-value">${price[key] != null ? "€" + price[key] : "–"}</span>
        </div>`
    ).join("");
    return `<div class="menu-item-price menu-item-price--wine">${cols}</div>`;
  }

  return `<div class="menu-item-price">${price}</div>`;
}
