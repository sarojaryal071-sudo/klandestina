#!/usr/bin/env node
// prerender.mjs
// script.js renders the full menu and the contact details entirely with
// JavaScript — fine for a browser, but it means a crawler that doesn't
// execute JS (or a quick text-extraction pass that only reads the raw
// HTML response) sees neither. This script writes plain, static English
// HTML for both straight into index.html, between fixed marker comments
// (`<!-- PRERENDER:MENU:START/END -->` inside #menu-list,
// `<!-- PRERENDER:CONTACT:START/END -->` inside #footer-mount) that
// already exist in the file — it only ever replaces what's between a
// pair of markers, never anything else in index.html.
//
// No dependencies (Node's own fs/path only), no DOM parser — index.html
// is treated as a plain string and spliced between the marker comments,
// which is enough since this only ever writes inside two already-known
// spots.
//
// This is NOT a duplicate layer sitting alongside the live site: both
// target containers (#menu-list, #footer-mount) are already fully
// overwritten by script.js the moment it runs (renderMenuCategory() does
// menuList.innerHTML = "" before rendering the active tab; renderFooter()
// does container.innerHTML = `<footer>...`) — so this prerendered content
// only exists in the window before script.js's fetch() calls resolve.
// Nothing in script.js needed to change for that to be true; it already
// behaved this way.
//
// Run manually after editing data/menu.json, data/site.json, or
// data/i18n/en.json: `node scripts/prerender.mjs`. Also runs in CI — see
// .github/workflows/prerender.yml — on every push that touches those
// files. If you edit index.html's surrounding markup by hand, re-run this
// afterward too (see README's "SEO" section) since CI only triggers on
// the data files, not on index.html itself.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { DISH_IMAGE_DIMS } from "../components/dishImageDims.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const menu = JSON.parse(readFileSync(path.join(ROOT, "data/menu.json"), "utf8"));
const site = JSON.parse(readFileSync(path.join(ROOT, "data/site.json"), "utf8"));
const en = JSON.parse(readFileSync(path.join(ROOT, "data/i18n/en.json"), "utf8"));

function t(dotPath) {
  return dotPath.split(".").reduce((node, key) => (node && typeof node === "object" ? node[key] : undefined), en);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// Mirrors components/priceDisplay.js's renderPrice() exactly (plain
// string, "", or a wine-style { glass12, glass16, glass24, bottle }
// object) so the static and live-rendered markup match.
function renderPriceHtml(price) {
  if (!price) return "";
  if (typeof price === "object") {
    const sizes = [
      ["glass12", "12cl"],
      ["glass16", "16cl"],
      ["glass24", "24cl"],
      ["bottle", "Btl"]
    ];
    const cols = sizes
      .map(
        ([key, label]) => `
        <div class="price-col">
          <span class="price-label">${label}</span>
          <span class="price-value">${price[key] != null ? "€" + price[key] : "–"}</span>
        </div>`
      )
      .join("");
    return `<div class="menu-item-price menu-item-price--wine">${cols}</div>`;
  }
  return `<div class="menu-item-price">${escapeHtml(price)}</div>`;
}

// Mirrors components/menuItem.js's renderMenuItem() markup/classes.
function renderItemHtml(item) {
  const hasPhoto = Boolean(item.image);
  const isWine = typeof item.price === "object" && item.price !== null;
  const classes = ["menu-item", !hasPhoto && "menu-item--no-photo", isWine && "menu-item--wine"].filter(Boolean).join(" ");
  const dims = hasPhoto ? DISH_IMAGE_DIMS[item.image] : null;
  const dimsAttr = dims ? ` width="${dims.w}" height="${dims.h}"` : "";
  const thumb = hasPhoto
    ? `<img class="menu-item-thumb" src="/images/dishes/${item.image}" alt="${escapeHtml(item.name)}" loading="lazy"${dimsAttr}>`
    : "";
  const allergenLabel = item.allergens && item.allergens.length ? item.allergens.join(" · ") : "";
  const description = item.description && item.description.en ? item.description.en : "";

  return `
      <div class="${classes}">
        ${thumb}
        <div class="menu-item-body">
          <div class="menu-item-top">
            <span class="menu-item-name">${escapeHtml(item.name)}</span>
            ${allergenLabel ? `<span class="menu-item-tag">${escapeHtml(allergenLabel)}</span>` : ""}
          </div>
          ${description ? `<div class="menu-item-desc">${escapeHtml(description)}</div>` : ""}
          ${renderPriceHtml(item.price)}
        </div>
      </div>`;
}

// One category/group (e.g. "lunch", or "wine" inside the Drinks umbrella)
// — heading + optional standing note (menu.notes.<id> in en.json, same
// as appendGroupNote() in script.js) + every item. Empty groups (none
// today) render nothing, same as the live UI would.
function renderGroupHtml(groupId, headingTag) {
  const items = menu[groupId] || [];
  if (items.length === 0) return "";
  const label = t(`menu.categories.${groupId}`) || groupId;
  const heading = `<${headingTag} class="menu-group-heading">${escapeHtml(label)}</${headingTag}>`;
  const note = t(`menu.notes.${groupId}`);
  const noteHtml = note ? `<p class="menu-note">${escapeHtml(note)}</p>` : "";
  const itemsHtml = items.map(renderItemHtml).join("\n");
  return [heading, noteHtml, itemsHtml].filter(Boolean).join("\n");
}

// Every category flattened one after another (not tab-separated — there
// are no tabs in this static version, just a readable, linear menu) so a
// crawler/no-JS visitor sees every item. "drinks" gets its own umbrella
// heading plus one sub-heading per group (Soft Drinks/Beer/Cocktails/
// Wine), matching menu.categories' own groups field.
function buildMenuHtml() {
  const sections = menu.categories
    .map((category) => {
      const groups = category.groups;
      if (groups && groups.length > 1) {
        const topLabel = t(`menu.categories.${category.id}`) || category.label;
        const topHeading = `<h3 class="menu-group-heading">${escapeHtml(topLabel)}</h3>`;
        const subsections = groups.map((g) => renderGroupHtml(g, "h4")).filter(Boolean).join("\n");
        return [topHeading, subsections].filter(Boolean).join("\n");
      }
      return renderGroupHtml(category.id, "h3");
    })
    .filter(Boolean);

  return sections.join("\n");
}

// Address/hours/email only — telephone is left out because data/site.json
// has no phone field (never invented; see README's "SEO" section).
// Reuses .footer-col/.container so it sits reasonably close to the real
// footer's own look for the brief window before footer.js replaces it.
function buildContactHtml() {
  const hoursHtml = site.hours.map((h) => `<span>${escapeHtml(h)}</span>`).join("\n          ");
  return `
    <div class="container footer-grid">
      <div class="footer-col">
        <h4>${escapeHtml(t("footer.visitLabel") || "Visit")}</h4>
        <span>${escapeHtml(site.address)}</span>
        <span>${escapeHtml(site.email)}</span>
      </div>
      <div class="footer-col">
        <h4>${escapeHtml(t("footer.hoursLabel") || "Hours")}</h4>
        ${hoursHtml}
      </div>
    </div>`;
}

// Replaces everything between a pair of marker comments that must already
// exist in the file exactly once each — throws rather than silently
// no-op'ing if either marker is missing, so a renamed/removed marker in
// index.html fails loudly instead of quietly leaving stale content.
function spliceBetweenMarkers(html, startMarker, endMarker, innerHtml) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`prerender.mjs: couldn't find marker pair ${startMarker} / ${endMarker} in index.html`);
  }
  const before = html.slice(0, start + startMarker.length);
  const after = html.slice(end);
  return `${before}\n${innerHtml}\n          ${after}`;
}

function run() {
  const indexPath = path.join(ROOT, "index.html");
  let html = readFileSync(indexPath, "utf8");

  html = spliceBetweenMarkers(html, "<!-- PRERENDER:MENU:START -->", "<!-- PRERENDER:MENU:END -->", buildMenuHtml());
  html = spliceBetweenMarkers(html, "<!-- PRERENDER:CONTACT:START -->", "<!-- PRERENDER:CONTACT:END -->", buildContactHtml());

  writeFileSync(indexPath, html);
  console.log("[prerender] wrote static menu + contact content into index.html");
}

run();
