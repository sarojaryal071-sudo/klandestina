// priceDisplay.js
// The price markup for a menu entry — shared by menuItem.js (the full menu
// list) and itemModal.js (the click-to-expand detail modal), split into its
// own module so neither of those two has to import the other just for this.

const WINE_SIZES = [
  { key: "glass12", label: "12cl" },
  { key: "glass16", label: "16cl" },
  { key: "glass24", label: "24cl" },
  { key: "bottle", label: "Btl" }
];

/**
 * A price is either a plain string, empty (nothing to show — a category
 * note covers it instead, e.g. Lunch's fixed price), or a wine-style object
 * with up to four sizes. Purely displayed text either way, never clickable.
 * @param {string|Object} price
 * @returns {string}
 */
export function renderPrice(price) {
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
