// map.js
// Interactive Leaflet map for the Find Us section — the site's own
// location, not a generic embed. Leaflet is loaded globally via a CDN
// <script> in index.html (before this module runs), so it's used here as
// the global `L`, the same way the CDN-loaded Google Fonts stylesheet is
// just referenced by font-family rather than imported.
//
// Tiles are free CartoDB basemaps (no API key): Dark Matter for the dark
// theme, Positron for light. Tiles are raster images, so — unlike the rest
// of the site's theming — a theme change can't be handled by CSS alone;
// a MutationObserver on <html data-theme> (the same attribute every other
// theme-aware bit of the site already keys off) swaps the layer. The
// marker, by contrast, is a plain L.divIcon styled entirely through the
// .map-marker rule in style.css via var(--accent) — no raster pin image,
// so it just follows the palette like everything else. See the README's
// "Known gaps" note on why the tiles themselves can't do the same.

const TILE_URLS = {
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
};
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

function currentTheme() {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

/**
 * @param {HTMLElement} container
 * @param {Object} opts
 * @param {number} opts.lat
 * @param {number} opts.lng
 * @param {string} [opts.label] - shown in the marker's popup
 */
export function renderMap(container, { lat, lng, label }) {
  container.innerHTML = `<div class="map-card"></div>`;
  const mapEl = container.querySelector(".map-card");

  const map = L.map(mapEl, {
    center: [lat, lng],
    zoom: 16,
    scrollWheelZoom: false // a page-scroll shouldn't get hijacked by a map sitting mid-section
  });

  let tileLayer = L.tileLayer(TILE_URLS[currentTheme()], { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);

  const icon = L.divIcon({ className: "map-marker", iconSize: [26, 34], iconAnchor: [13, 34] });
  const marker = L.marker([lat, lng], { icon }).addTo(map);
  if (label) marker.bindPopup(label);

  new MutationObserver(() => {
    const nextUrl = TILE_URLS[currentTheme()];
    if (tileLayer._url === nextUrl) return;
    map.removeLayer(tileLayer);
    tileLayer = L.tileLayer(nextUrl, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  return map;
}
