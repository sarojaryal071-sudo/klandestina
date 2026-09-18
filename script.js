// script.js — the conductor.
// Loads data, imports each component, and fills the empty containers in
// index.html. This file wires things together; it doesn't define what a
// card or button LOOKS like — that's each component's own job.

import { renderNav } from "./components/nav.js";
import { renderButton } from "./components/button.js";
import { renderDishCard } from "./components/dishCard.js";
import { renderMenuItem } from "./components/menuItem.js";
import { renderGalleryTile } from "./components/galleryTile.js";
import { renderFooter } from "./components/footer.js";

async function init() {
  const [menu, site, gallery] = await Promise.all([
    fetch("data/menu.json").then((r) => r.json()),
    fetch("data/site.json").then((r) => r.json()),
    fetch("data/gallery.json").then((r) => r.json())
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

  // Full menu, with category tabs
  initMenuTabs(menu);

  // Gallery
  const galleryGrid = document.getElementById("gallery-grid");
  gallery.forEach((photo) => galleryGrid.appendChild(renderGalleryTile(photo)));

  // Footer
  renderFooter(document.getElementById("footer-mount"), site);
}

// Wires the category pills above the full menu: renders one tab per entry in
// menu.categories, and swaps menu-list's contents to match whichever tab is
// active (starting on the first category).
function initMenuTabs(menu) {
  const tabsContainer = document.getElementById("menu-tabs");

  menu.categories.forEach((category, index) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "tab";
    tab.textContent = category.label;
    tab.dataset.category = category.id;
    if (index === 0) tab.classList.add("active");

    tab.addEventListener("click", () => {
      if (tab.classList.contains("active")) return;
      tabsContainer.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      renderMenuCategory(menu, category.id);
    });

    tabsContainer.appendChild(tab);
  });

  renderMenuCategory(menu, menu.categories[0].id);
}

function renderMenuCategory(menu, categoryId) {
  const menuList = document.getElementById("menu-list");
  menuList.innerHTML = "";

  const items = menu[categoryId] || [];
  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "menu-empty";
    empty.textContent = "Coming soon.";
    menuList.appendChild(empty);
    return;
  }

  items.forEach((item) => menuList.appendChild(renderMenuItem(item)));
}

init();
