// map.js
// Google Maps embed for the Visit section — the plain no-API-key
// `maps?q=...&output=embed` iframe, not the JS Maps SDK. Replaces an
// earlier Leaflet/OpenStreetMap version (see git history if that's ever
// needed again); this needs no tile server, no marker/popup styling, and
// no lat/lng (a text query on the address is enough).
//
// The iframe sets Google's own cookies once it loads, so it's never
// loaded automatically: a facade card (address, a short line, a "Show
// map" button) stands in until the visitor actually asks for it — same
// click-to-load pattern now common for any third-party embed with a
// privacy cost. The facade and the loaded iframe are two absolutely-
// positioned layers inside one fixed-aspect-ratio card (style.css), so
// swapping between them never changes the card's box size — no layout
// shift either way.

function mapsUrls(address, lang) {
  const q = encodeURIComponent(address);
  return {
    embed: `https://www.google.com/maps?q=${q}&output=embed&hl=${lang}`,
    directions: `https://www.google.com/maps/dir/?api=1&destination=${q}`,
    search: `https://www.google.com/maps/search/?api=1&query=${q}`
  };
}

/**
 * @param {HTMLElement} container
 * @param {Object} opts
 * @param {string} opts.address - site.json's own address string, the one
 *   source of truth every URL and the visible text below are built from —
 *   never a separately hardcoded copy.
 * @param {string} opts.lang    - "en" | "fi" — sets the embed's own hl
 *   param so Google's UI chrome (its own "Directions"/zoom controls, not
 *   this page's text) matches the page language too.
 * @param {Object} opts.strings - pre-resolved, already-translated UI text
 *   (this component doesn't know about i18n itself — same split
 *   footer.js/itemModal.js follow): { findTheDoor, marketHallNote,
 *   showMap, getDirections, openInGoogleMaps, tapToInteract,
 *   mapCookieNote, mapTitlePrefix }
 */
export function renderMap(container, { address, lang, strings }) {
  const urls = mapsUrls(address, lang);
  const title = `${strings.mapTitlePrefix}: Klandestina, ${address}`;

  container.innerHTML = `
    <div class="visit-map-card">
      <div class="visit-map-facade" id="visit-map-facade">
        <span class="visit-map-eyebrow">${strings.findTheDoor}</span>
        <p class="visit-map-address">${address}<br><span class="visit-map-note">${strings.marketHallNote}</span></p>
        <button type="button" class="btn btn-primary" id="visit-map-show">${strings.showMap}</button>
      </div>
      <div class="visit-map-frame-wrap" id="visit-map-frame-wrap" hidden>
        <iframe
          class="visit-map-iframe" title="${title}" loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
        ></iframe>
        <button type="button" class="visit-map-touch-overlay" id="visit-map-touch-overlay" aria-label="${strings.tapToInteract}">
          <span>${strings.tapToInteract}</span>
        </button>
      </div>
    </div>
    <p class="visit-map-cookie-note" id="visit-map-cookie-note">${strings.mapCookieNote}</p>
    <div class="visit-map-actions">
      <a class="btn btn-primary" href="${urls.directions}" target="_blank" rel="noopener">${strings.getDirections}</a>
      <a class="btn btn-ghost" href="${urls.search}" target="_blank" rel="noopener">${strings.openInGoogleMaps}</a>
    </div>
    <p class="visit-map-address-line">
      <a href="${urls.search}" target="_blank" rel="noopener">${address}</a>
    </p>
  `;

  const facade = container.querySelector("#visit-map-facade");
  const frameWrap = container.querySelector("#visit-map-frame-wrap");
  const iframe = container.querySelector(".visit-map-iframe");
  const cookieNote = container.querySelector("#visit-map-cookie-note");
  const touchOverlay = container.querySelector("#visit-map-touch-overlay");

  container.querySelector("#visit-map-show").addEventListener("click", () => {
    iframe.src = urls.embed; // only ever set here — the one point this embed can cost a cookie
    facade.hidden = true;
    frameWrap.hidden = false;
    cookieNote.hidden = true;
  });

  // Touch-only hint (CSS gates its visibility to coarse-pointer devices —
  // see style.css): the overlay catches the first tap instead of the map
  // underneath it, so that tap doesn't start a pan/zoom gesture that
  // fights the page's own scroll. One tap removes it for good; every tap
  // after that reaches the map normally.
  touchOverlay.addEventListener("click", () => touchOverlay.remove());
}
