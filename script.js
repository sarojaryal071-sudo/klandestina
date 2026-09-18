// script.js — the conductor.
// Loads data, imports each component, and fills the empty containers in
// index.html. This file wires things together; it doesn't define what a
// card or button LOOKS like — that's each component's own job.
//
// It also owns two small pieces of cross-cutting state that every section
// depends on: the active language (en/fi/es) and the active theme
// (dark/light, though the theme's actual styling lives entirely in
// style.css — this file only flips the <html data-theme> attribute).

import { renderNav } from "./components/nav.js";
import { renderButton } from "./components/button.js";
import { renderDishCard } from "./components/dishCard.js";
import { renderMenuItem } from "./components/menuItem.js";
import { renderGalleryTile } from "./components/galleryTile.js";
import { renderFooter } from "./components/footer.js";
import { renderLangSwitch, setActiveLang } from "./components/langSwitch.js";
import { renderThemeToggle } from "./components/themeToggle.js";

const LANG_STORAGE_KEY = "klandestina-lang";
const THEME_STORAGE_KEY = "klandestina-theme";
const SUPPORTED_LANGS = ["en", "fi", "es"];

let i18n = {};
let menu = null;
let site = null;
let currentLanguage = "en";
let activeCategoryId = null;

async function init() {
  const [menuData, siteData, en, fi, es] = await Promise.all([
    fetch("data/menu.json").then((r) => r.json()),
    fetch("data/site.json").then((r) => r.json()),
    fetch("data/i18n/en.json").then((r) => r.json()),
    fetch("data/i18n/fi.json").then((r) => r.json()),
    fetch("data/i18n/es.json").then((r) => r.json())
  ]);

  menu = menuData;
  site = siteData;
  i18n = { en, fi, es };
  currentLanguage = getStoredLanguage();

  // Nav
  renderNav(document.getElementById("shortcut-nav"));
  document.getElementById("brand-mark").textContent = site.name;

  // Language switcher + theme toggle
  renderLangSwitch(document.getElementById("lang-switch"), currentLanguage, setLanguage);
  renderThemeToggle(document.getElementById("theme-toggle"), toggleTheme);

  // Hero buttons
  const heroButtons = document.getElementById("hero-buttons");
  heroButtons.appendChild(
    renderButton({ label: t("hero.reserve"), href: site.reservationUrl, style: "primary", newTab: true, i18nKey: "hero.reserve" })
  );
  heroButtons.appendChild(
    renderButton({ label: t("hero.seeMenu"), href: "#menu", style: "ghost", i18nKey: "hero.seeMenu" })
  );

  // Visit section: address/hours/email come straight from site.json and
  // aren't translated, only the labels around them are.
  document.getElementById("visit-address").textContent = site.address;
  document.getElementById("visit-email").textContent = site.email;
  document.getElementById("visit-hours").innerHTML = site.hours.map((h) => `<span>${h}</span>`).join("");
  document.getElementById("visit-buttons").appendChild(
    renderButton({ label: t("hero.reserve"), href: site.reservationUrl, style: "primary", newTab: true, i18nKey: "hero.reserve" })
  );

  // Gallery (photos and their filenames don't depend on language)
  const galleryGrid = document.getElementById("gallery-grid");
  menu.gallery.forEach((photo) => galleryGrid.appendChild(renderGalleryTile(photo)));

  // Footer
  renderFooter(document.getElementById("footer-mount"), site);

  // Signature dishes + full menu, both language-dependent
  renderSignatureDishes();
  initMenuTabs();

  applyTranslations();
}

// ---------- i18n ----------

function getStoredLanguage() {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
  } catch (e) {
    /* localStorage unavailable (private mode, etc.) — fall through to default */
  }
  return "en";
}

function setLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang) || lang === currentLanguage) return;
  currentLanguage = lang;
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch (e) {
    /* ignore — language just won't persist across visits */
  }

  setActiveLang(document.getElementById("lang-switch"), lang);
  renderSignatureDishes();
  renderMenuCategory(activeCategoryId);
  applyTranslations();
}

// Looks up a dot-path in the active language's dict, falling back to
// English if that key is missing there too.
function t(path) {
  return resolveKey(i18n[currentLanguage], path) ?? resolveKey(i18n.en, path) ?? path;
}

function resolveKey(dict, path) {
  return path.split(".").reduce((node, key) => (node && typeof node === "object" ? node[key] : undefined), dict);
}

// Resolves a menu.json field that may be a plain string (price, tag, name)
// or a { en, fi, es } object (description) into the active language's text.
function pickLang(field) {
  if (field && typeof field === "object") return field[currentLanguage] || field.en || "";
  return field;
}

// Single pass over every element tagged data-i18n="some.path" — covers
// static markup in index.html plus the data-i18n hooks nav.js, footer.js
// and button.js leave on the elements they render.
function applyTranslations() {
  document.documentElement.lang = currentLanguage;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
}

// ---------- theme ----------

function toggleTheme() {
  const html = document.documentElement;
  const next = html.getAttribute("data-theme") === "light" ? "dark" : "light";
  if (next === "light") html.setAttribute("data-theme", "light");
  else html.removeAttribute("data-theme");
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch (e) {
    /* ignore — theme just won't persist across visits */
  }
}

// ---------- language-dependent rendering ----------

function renderSignatureDishes() {
  const dishGrid = document.getElementById("dish-grid");
  dishGrid.innerHTML = "";
  menu.signatureDishes.forEach((dish) => {
    dishGrid.appendChild(renderDishCard({ ...dish, description: pickLang(dish.description) }));
  });
}

// Wires the category pills above the full menu: renders one tab per entry in
// menu.categories, and swaps menu-list's contents to match whichever tab is
// active (starting on the first category).
function initMenuTabs() {
  const tabsContainer = document.getElementById("menu-tabs");
  tabsContainer.innerHTML = "";

  menu.categories.forEach((category, index) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "tab";
    tab.dataset.category = category.id;
    tab.dataset.i18n = `menu.categories.${category.id}`;
    tab.textContent = category.label;
    if (index === 0) tab.classList.add("active");

    tab.addEventListener("click", () => {
      if (tab.classList.contains("active")) return;
      tabsContainer.querySelectorAll(".tab").forEach((el) => el.classList.remove("active"));
      tab.classList.add("active");
      activeCategoryId = category.id;
      renderMenuCategory(category.id);
    });

    tabsContainer.appendChild(tab);
  });

  activeCategoryId = menu.categories[0].id;
  renderMenuCategory(activeCategoryId);
}

function renderMenuCategory(categoryId) {
  const menuList = document.getElementById("menu-list");
  menuList.innerHTML = "";

  const items = menu[categoryId] || [];
  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "menu-empty";
    empty.dataset.i18n = "menu.comingSoon";
    empty.textContent = t("menu.comingSoon");
    menuList.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    menuList.appendChild(renderMenuItem({ ...item, description: pickLang(item.description) }));
  });
}

init();
