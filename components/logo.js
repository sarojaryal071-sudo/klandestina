// logo.js
// Shared brand-mark markup for every place "Klandestina" renders as a
// clickable logo rather than body prose: the desktop topbar (#brand-mark),
// the mobile fixed topbar, the mobile hamburger nav overlay, and the
// footer. One function so the markup is defined once instead of four
// times.
//
// Plain text wordmark, not an image — a mascot-badge image briefly
// replaced it, was never actually Klandestina's logo, and has since been
// removed completely (the image files, the script that generated them,
// and the "logo" field in data/site.json are all gone). Sizing is
// CSS-only, one font-size per placement (#brand-mark,
// .mobile-topbar-brand, .mobile-nav-brand, .footer-logo in style.css) —
// the same font-size rules the site already had in place for this text
// mark before any logo image existed.

/**
 * @param {Object} [opts]
 * @param {string} [opts.homeHref] - "/" or "/fi/" depending on the active language, so the
 *   logo always links to home IN the language currently being viewed, not always English.
 * @returns {string} HTML to place inside an existing brand-mark container
 *   (#brand-mark, .mobile-topbar-brand, .mobile-nav-brand, .footer-logo).
 */
export function brandLogoHTML({ homeHref = "/" } = {}) {
  return `<a href="${homeHref}" class="brand-link brand-wordmark">KLANDESTINA</a>`;
}
