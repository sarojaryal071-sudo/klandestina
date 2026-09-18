// dishCard.js
// The ONE universal dish card design. Every signature dish on the site —
// no matter how many there are — is stamped out from this single function.
// Add a new dish to data/menu.json and a matching card appears automatically;
// this file never needs to change just because a dish was added or removed.

/**
 * @param {Object} dish
 * @param {string} dish.name
 * @param {string} dish.price
 * @param {string} dish.description
 * @param {string} dish.image        - filename inside images/dishes/
 * @returns {HTMLElement} the finished card, ready to insert into the page
 */
export function renderDishCard(dish) {
  const frame = document.createElement("div");
  frame.className = "tilt-frame reveal";

  frame.innerHTML = `
    <div class="dish-visual visual tilt-card">
      <img class="visual-img" src="images/dishes/${dish.image}" alt="" loading="lazy" decoding="async">
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

  return frame;
}
