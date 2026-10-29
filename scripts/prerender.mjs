#!/usr/bin/env node
// prerender.mjs
// script.js renders the full menu, the contact details, and which
// language is showing entirely with JavaScript — fine for a browser, but
// it means a crawler that doesn't execute JS (or a quick text-extraction
// pass that only reads the raw HTML response) sees none of that. This
// script writes two static documents from the same data:
//
//   index.html    — English, built from data/i18n/en.json
//   fi/index.html — Finnish, built from data/i18n/fi.json
//
// Both get the full menu (every category, not just the active tab) and
// the address/hours/email block as plain HTML between fixed marker
// comments (`<!-- PRERENDER:MENU:START/END -->` inside #menu-list,
// `<!-- PRERENDER:CONTACT:START/END -->` inside #footer-mount) that
// already exist in index.html — this only ever replaces what's between a
// marker pair, never anything else. fi/index.html also gets its static
// data-i18n text (the hero headline, section eyebrows, Story's copy,
// etc.) swapped to the matching Finnish string, <html lang="fi">,
// <title>/meta description/canonical/og:*/twitter:* swapped to the
// Finnish seo.title/seo.description and the /fi/ URL, so a crawler
// landing directly on /fi/ sees a genuinely Finnish page, not an English
// one that only becomes Finnish once script.js runs.
//
// No dependencies (Node's own fs/path only), no DOM parser — index.html
// is treated as a plain string and spliced/replaced at known points,
// which is enough since every edit here targets an exact marker, a fixed
// handful of known <head> values, or a `data-i18n="key">text<` pattern.
//
// This is NOT a duplicate layer sitting alongside the live site: the two
// prerendered containers (#menu-list, #footer-mount) are already fully
// overwritten by script.js the moment it runs (renderMenuCategory() does
// menuList.innerHTML = "" before rendering the active tab; renderFooter()
// does container.innerHTML = `<footer>...`), and which language's text
// is showing is now decided by the URL the same way on both the static
// and the JS-rendered content — so nothing here fights with script.js,
// it just makes sure the content already matches it from first paint.
//
// Run manually after editing data/menu.json, data/site.json, or either
// data/i18n/*.json file: `node scripts/prerender.mjs`. Also runs in CI —
// see .github/workflows/prerender.yml — on every push that touches those
// files. If you edit index.html's surrounding markup by hand, re-run this
// afterward too (see README's "SEO" section) since CI only triggers on
// the data files, not on index.html itself — and a hand-edit to
// index.html's markup needs to re-propagate into fi/index.html the same
// way any other prerender run would.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { DISH_IMAGE_DIMS } from "../components/dishImageDims.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE_URL = "https://klande.fi";

const menu = JSON.parse(readFileSync(path.join(ROOT, "data/menu.json"), "utf8"));
const site = JSON.parse(readFileSync(path.join(ROOT, "data/site.json"), "utf8"));
const i18n = {
  en: JSON.parse(readFileSync(path.join(ROOT, "data/i18n/en.json"), "utf8")),
  fi: JSON.parse(readFileSync(path.join(ROOT, "data/i18n/fi.json"), "utf8"))
};

function t(dict, dotPath) {
  return dotPath.split(".").reduce((node, key) => (node && typeof node === "object" ? node[key] : undefined), dict);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// Mirrors components/priceDisplay.js's renderPrice() exactly (plain
// string, "", or a wine-style { glass12, glass16, glass24, bottle }
// object) so the static and live-rendered markup match. Prices/currency
// aren't translated, so this needs no language parameter.
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

// Mirrors components/menuItem.js's renderMenuItem() markup/classes. The
// item's own name and allergen codes are language-independent (printed
// exactly as stored in data/menu.json either way); only the description
// is per-language.
function renderItemHtml(item, lang) {
  const hasPhoto = Boolean(item.image);
  const isWine = typeof item.price === "object" && item.price !== null;
  const classes = ["menu-item", !hasPhoto && "menu-item--no-photo", isWine && "menu-item--wine"].filter(Boolean).join(" ");
  const dims = hasPhoto ? DISH_IMAGE_DIMS[item.image] : null;
  const dimsAttr = dims ? ` width="${dims.w}" height="${dims.h}"` : "";
  const thumb = hasPhoto
    ? `<img class="menu-item-thumb" src="/images/dishes/${item.image}" alt="${escapeHtml(item.name)}" loading="lazy"${dimsAttr}>`
    : "";
  const allergenLabel = item.allergens && item.allergens.length ? item.allergens.join(" · ") : "";
  const description = item.description && item.description[lang] ? item.description[lang] : "";

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
// — heading + optional standing note (menu.notes.<id>, same as
// appendGroupNote() in script.js) + every item. Empty groups (none
// today) render nothing, same as the live UI would.
function renderGroupHtml(groupId, headingTag, dict, lang) {
  const items = menu[groupId] || [];
  if (items.length === 0) return "";
  const label = t(dict, `menu.categories.${groupId}`) || groupId;
  const heading = `<${headingTag} class="menu-group-heading">${escapeHtml(label)}</${headingTag}>`;
  const note = t(dict, `menu.notes.${groupId}`);
  const noteHtml = note ? `<p class="menu-note">${escapeHtml(note)}</p>` : "";
  const itemsHtml = items.map((item) => renderItemHtml(item, lang)).join("\n");
  return [heading, noteHtml, itemsHtml].filter(Boolean).join("\n");
}

// Every category flattened one after another (not tab-separated — there
// are no tabs in this static version, just a readable, linear menu) so a
// crawler/no-JS visitor sees every item. "drinks" gets its own umbrella
// heading plus one sub-heading per group (Soft Drinks/Beer/Cocktails/
// Wine), matching menu.categories' own groups field.
function buildMenuHtml(dict, lang) {
  const sections = menu.categories
    .map((category) => {
      const groups = category.groups;
      if (groups && groups.length > 1) {
        const topLabel = t(dict, `menu.categories.${category.id}`) || category.label;
        const topHeading = `<h3 class="menu-group-heading">${escapeHtml(topLabel)}</h3>`;
        const subsections = groups.map((g) => renderGroupHtml(g, "h4", dict, lang)).filter(Boolean).join("\n");
        return [topHeading, subsections].filter(Boolean).join("\n");
      }
      return renderGroupHtml(category.id, "h3", dict, lang);
    })
    .filter(Boolean);

  return sections.join("\n");
}

// Address/hours/email only — telephone is left out because data/site.json
// has no phone field (never invented; see README's "SEO" section). Those
// three are facts, not translated text, so only the "Visit"/"Hours"
// column headings actually change between languages. Reuses
// .footer-col/.container so it sits reasonably close to the real
// footer's own look for the brief window before footer.js replaces it.
function buildContactHtml(dict) {
  const hoursHtml = site.hours.map((h) => `<span>${escapeHtml(h)}</span>`).join("\n          ");
  return `
    <div class="container footer-grid">
      <div class="footer-col">
        <h4>${escapeHtml(t(dict, "footer.visitLabel") || "Visit")}</h4>
        <span>${escapeHtml(site.address)}</span>
        <span>${escapeHtml(site.email)}</span>
      </div>
      <div class="footer-col">
        <h4>${escapeHtml(t(dict, "footer.hoursLabel") || "Hours")}</h4>
        ${hoursHtml}
      </div>
    </div>`;
}

// Replaces everything between a pair of marker comments that must already
// exist in the html exactly once each — throws rather than silently
// no-op'ing if either marker is missing, so a renamed/removed marker
// fails loudly instead of quietly leaving stale content.
function spliceBetweenMarkers(html, startMarker, endMarker, innerHtml) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`prerender.mjs: couldn't find marker pair ${startMarker} / ${endMarker}`);
  }
  const before = html.slice(0, start + startMarker.length);
  const after = html.slice(end);
  return `${before}\n${innerHtml}\n          ${after}`;
}

// Every statically-written data-i18n="path">Text< element in index.html's
// own markup (the hero headline, section eyebrows, Story's copy, the
// visit email prefix/Get Directions link — see README's "Finnish URL")
// — swapped to the given dict's string for that path. Every one of these
// in the file today has data-i18n as its tag's LAST attribute, directly
// followed by its plain-text content and a closing tag with no nested
// markup in between, which is what this (intentionally non-general)
// pattern relies on; an element that stops matching it would just fail
// to get translated, not corrupt anything, since the replacer only ever
// touches text it successfully matched a known i18n path for.
function translateStaticText(html, dict) {
  return html.replace(/data-i18n="([\w.]+)">([^<]*)</g, (match, key, _original) => {
    const translated = t(dict, key);
    return translated == null ? match : `data-i18n="${key}">${escapeHtml(translated)}<`;
  });
}

// Replaces the first occurrence of an exact, known string with another —
// throws if it's not found, same "fail loudly rather than silently
// no-op" reasoning as spliceBetweenMarkers, so a future wording change to
// a title/description this depends on breaks the build instead of
// quietly shipping a half-English /fi/ page.
function requireReplace(html, oldStr, newStr) {
  if (!html.includes(oldStr)) {
    throw new Error(`prerender.mjs: expected to find ${JSON.stringify(oldStr)} in index.html`);
  }
  return html.replace(oldStr, newStr);
}

// <title>/meta description/canonical/og:*/twitter:* all need the
// language-specific seo.title/seo.description and the /fi/ URL instead
// of the root. Each swap below targets one exact, unique, full tag (or
// attribute) string already in the English page, rather than a general
// find/replace across the whole URL — so there's no risk of also
// touching the hreflang links or og:image/JSON-LD, which stay pointed at
// the same place on both pages. og:image and the JSON-LD block aren't
// touched at all: both describe the one restaurant, not "this page", so
// they stay identical on / and /fi/.
function localizeHead(html) {
  const enSeo = { title: t(i18n.en, "seo.title"), description: t(i18n.en, "seo.description") };
  const fiSeo = { title: t(i18n.fi, "seo.title"), description: t(i18n.fi, "seo.description") };

  let out = html;
  out = requireReplace(out, '<html lang="en">', '<html lang="fi">');
  out = requireReplace(out, `<title>${enSeo.title}</title>`, `<title>${fiSeo.title}</title>`);
  out = requireReplace(
    out,
    `<meta name="description" content="${enSeo.description}">`,
    `<meta name="description" content="${fiSeo.description}">`
  );
  out = requireReplace(out, `<link rel="canonical" href="${SITE_URL}/">`, `<link rel="canonical" href="${SITE_URL}/fi/">`);
  out = requireReplace(
    out,
    `<meta property="og:title" content="${enSeo.title}">`,
    `<meta property="og:title" content="${fiSeo.title}">`
  );
  out = requireReplace(
    out,
    `<meta property="og:description" content="${enSeo.description}">`,
    `<meta property="og:description" content="${fiSeo.description}">`
  );
  out = requireReplace(out, `<meta property="og:url" content="${SITE_URL}/">`, `<meta property="og:url" content="${SITE_URL}/fi/">`);
  out = requireReplace(out, '<meta property="og:locale" content="en_US">', '<meta property="og:locale" content="fi_FI">');
  out = requireReplace(
    out,
    '<meta property="og:locale:alternate" content="fi_FI">',
    '<meta property="og:locale:alternate" content="en_US">'
  );
  out = requireReplace(
    out,
    `<meta name="twitter:title" content="${enSeo.title}">`,
    `<meta name="twitter:title" content="${fiSeo.title}">`
  );
  out = requireReplace(
    out,
    `<meta name="twitter:description" content="${enSeo.description}">`,
    `<meta name="twitter:description" content="${fiSeo.description}">`
  );

  return out;
}

function buildPage(lang) {
  const dict = i18n[lang];
  const templatePath = path.join(ROOT, "index.html");
  let html = readFileSync(templatePath, "utf8");

  html = spliceBetweenMarkers(html, "<!-- PRERENDER:MENU:START -->", "<!-- PRERENDER:MENU:END -->", buildMenuHtml(dict, lang));
  html = spliceBetweenMarkers(html, "<!-- PRERENDER:CONTACT:START -->", "<!-- PRERENDER:CONTACT:END -->", buildContactHtml(dict));

  if (lang === "fi") {
    html = translateStaticText(html, dict);
    html = localizeHead(html);
  }

  return html;
}

function run() {
  const enHtml = buildPage("en");
  writeFileSync(path.join(ROOT, "index.html"), enHtml);
  console.log("[prerender] wrote static menu + contact content into index.html");

  // fi/index.html is generated FROM index.html (buildPage reads the
  // template fresh each call), so it's built from the EN markup's
  // structure every time — never hand-edited, never drifts from it.
  const fiHtml = buildPage("fi");
  mkdirSync(path.join(ROOT, "fi"), { recursive: true });
  writeFileSync(path.join(ROOT, "fi/index.html"), fiHtml);
  console.log("[prerender] wrote fi/index.html");
}

run();
