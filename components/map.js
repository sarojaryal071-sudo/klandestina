// map.js
// Google Maps embed for the Visit section — the plain no-API-key
// `maps?q=...&output=embed` iframe, not the JS Maps SDK. Needs no tile
// server, no marker/popup styling, and no lat/lng (a text query on the
// address is enough).
//
// The iframe is always in the card and loads directly — no "Show map"
// facade/click-to-load gate. loading="lazy" still defers the actual
// network fetch until the card scrolls near the viewport (so a visitor
// who never reaches Visit never costs Google a request), but once it
// does, the map is interactive immediately on every device — no overlay,
// no "tap to interact" hint. The card's own dark background (style.css's
// .visit-map-card) sits behind the iframe at its fixed aspect ratio the
// whole time, so there's a dark placeholder rather than a blank/white
// flash before the iframe's own content paints, and no layout shift
// either way.
//
// The iframe element itself is created once and never replaced — a
// language switch (script.js's setLanguage()) calls this again, but
// re-targets the SAME <iframe> node's src/title in place instead of
// tearing it out and re-attaching a fresh one. A newly-attached iframe
// loading mid-page is exactly the kind of DOM change that can fight the
// page's own restored scroll position (load-related focus/scroll-into-
// view behavior some browsers apply to a just-inserted iframe); updating
// src on the existing node sidesteps that risk entirely rather than
// relying on the scroll-anchor restore to paper over it after the fact.

function mapsUrls(address, lang) {
  const q = encodeURIComponent(address);
  return {
    embed: `https://www.google.com/maps?q=${q}&output=embed&hl=${lang}`,
    directions: `https://www.google.com/maps/dir/?api=1&destination=${q}`
  };
}

/**
 * @param {HTMLElement} container
 * @param {Object} opts
 * @param {string} opts.address - site.json's own address string, the one
 *   source of truth every URL and the visible text below are built from —
 *   never a separately hardcoded copy.
 * @param {string} opts.lang    - "en" | "fi" — sets the embed's own hl
 *   param so Google's UI chrome (its own zoom/pan controls, not this
 *   page's text) matches the page language too.
 * @param {Object} opts.strings - pre-resolved, already-translated UI text
 *   (this component doesn't know about i18n itself — same split
 *   footer.js/itemModal.js follow): { marketHallNote, getDirections,
 *   mapTitlePrefix }
 */
export function renderMap(container, { address, lang, strings }) {
  const urls = mapsUrls(address, lang);
  const title = `${strings.mapTitlePrefix}: Klandestina, ${address}`;

  let iframe = container.querySelector(".visit-map-iframe");
  if (!iframe) {
    container.innerHTML = `
      <div class="visit-map-card">
        <iframe
          class="visit-map-iframe" loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
      <div class="visit-map-actions">
        <a class="btn btn-primary visit-map-directions" target="_blank" rel="noopener"></a>
      </div>
      <p class="visit-map-address-line">
        ${address}<br><span class="visit-map-note"></span>
      </p>
    `;
    iframe = container.querySelector(".visit-map-iframe");
  }

  iframe.src = urls.embed;
  iframe.title = title;

  const directions = container.querySelector(".visit-map-directions");
  directions.href = urls.directions;
  directions.textContent = strings.getDirections;

  container.querySelector(".visit-map-note").textContent = strings.marketHallNote;
}
