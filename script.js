// script.js — the conductor.
// Loads data, imports each component, and fills the empty containers in
// index.html. This file wires things together; it doesn't define what a
// card or button LOOKS like — that's each component's own job.
//
// STATUS: skeleton only. Full rendering logic + scroll-reveal + tilt-hover
// wiring is the next step (the "1st prototype" build).

import { renderNav } from "./components/nav.js";
import { renderButton } from "./components/button.js";
import { renderDishCard } from "./components/dishCard.js";
import { renderMenuItem } from "./components/menuItem.js";
import { renderGalleryTile } from "./components/galleryTile.js";
import { renderFooter } from "./components/footer.js";

async function init() {
  const [menu, site] = await Promise.all([
    fetch("data/menu.json").then((r) => r.json()),
    fetch("data/site.json").then((r) => r.json())
  ]);

  // Nav
  renderNav(document.getElementById("shortcut-nav"));
  document.getElementById("brand-mark").textContent = site.name;

  // Hero buttons
  const heroButtons = document.getElementById("hero-buttons");
  heroButtons.appendChild(
    renderButton({ label: "Reserve a Table", href: site.reservationUrl, style: "primary", newTab: true })
  );
  heroButtons.appendChild(
    renderButton({ label: "See the Menu", href: "#menu", style: "ghost" })
  );

  // Signature dishes
  const dishGrid = document.getElementById("dish-grid");
  menu.signatureDishes.forEach((dish) => dishGrid.appendChild(renderDishCard(dish)));

  // Full menu (category tabs — wiring TBD in next pass)
  const menuList = document.getElementById("menu-list");
  menu.starters.forEach((item) => menuList.appendChild(renderMenuItem(item)));

  // Footer
  renderFooter(document.getElementById("footer-mount"), site);
}

init();
