// dishCard.js
// The ONE universal dish card design. Every signature dish on the site —
// no matter how many there are — is stamped out from this single function.
// Add a new dish to data/menu.json and a matching card appears automatically;
// this file never needs to change just because a dish was added or removed.
//
// The photo comes from the same filename convention as the full menu list
// (dishImage.js — images/dishes/<slugified-name>.jpg, no manual "image"
// field needed). Unlike a menu row, this card is photo-first — the caption
// sits on a scrim OVER the image — so there's no plain "text only" fallback
// if that file 404s; .visual's own background-color (set in style.css,
// already the fallback shown while a real photo is still loading) simply
// stays visible behind the scrim/caption instead, reading as an
// intentional dark card rather than a broken image. Clicking (or Enter/
// Space on) a card opens the shared item detail modal (itemModal.js) with
// a larger version of the same lookup.

import { dishImagePath } from "./dishImage.js";
import { openItemModal } from "./itemModal.js";

/**
 * @param {Object} dish
 * @param {string} dish.name
 * @param {string} dish.price
 * @param {string} dish.description
 * @returns {HTMLElement} the finished card, ready to insert into the page
 */
export function renderDishCard(dish) {
  const frame = document.createElement("div");
  frame.className = "tilt-frame reveal";

  frame.innerHTML = `
    <div
      class="dish-visual visual tilt-card" role="button" tabindex="0" aria-label="${dish.name}"
    >
      <img
        class="visual-img" src="${dishImagePath(dish.name)}" alt="" loading="lazy" decoding="async"
        onerror="this.remove();"
      >
      <div class="scrim"></div>
      <div class="caption">
        <div class="dish-top">
          <h3>${dish.name}</h3>
          <span class="dish-price">${dish.price}</span>
        </div>
        <p>${dish.description}</p>
      </div>
    </div>
  `;

  const card = frame.querySelector(".dish-visual");
  card.addEventListener("click", () => openItemModal(dish));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openItemModal(dish);
    }
  });

  return frame;
}
