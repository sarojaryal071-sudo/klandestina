// map.js
// Interactive Leaflet map for the Find Us section — the site's own
// location, not a generic embed. Leaflet is loaded globally via a CDN
// <script> in index.html (before this module runs), so it's used here as
// the global `L`, the same way the CDN-loaded Google Fonts stylesheet is
// just referenced by font-family rather than imported.
//
// Tiles are plain OpenStreetMap raster tiles. CartoDB's free Dark Matter/
// Positron tiles (used previously) now require a registered API key on a
// live domain, which showed up as a watermarked "API key required" tile
// instead of a map. OSM only ships one (light) tile style, so the dark
// theme is simulated with a CSS filter on .leaflet-tile-pane in
// style.css, scoped to that pane specifically so it doesn't also invert
// the marker or popup — see the README's "Known gaps" note. Since that's
// pure CSS keyed off the existing :root[data-theme] selector, there's no
// JS-side theme switching needed here at all (unlike the old per-theme
// tile URL, which did need a MutationObserver to swap it).
//
// The marker is a plain L.divIcon styled entirely through the .map-marker
// rule in style.css via var(--accent) — no raster pin image, so it just
// follows the palette like everything else, unaffected by the tile
// pane's dark-theme filter.

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

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

  L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);

  const icon = L.divIcon({ className: "map-marker", iconSize: [26, 34], iconAnchor: [13, 34] });
  const marker = L.marker([lat, lng], { icon }).addTo(map);
  if (label) marker.bindPopup(label);

  return map;
}
