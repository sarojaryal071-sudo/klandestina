// logo.js
// Shared brand-mark markup for every place "Klandestina" renders as a
// wordmark/logo rather than body prose: the desktop topbar (#brand-mark),
// the mobile fixed topbar, the mobile hamburger nav overlay, and the
// footer. One function so the fallback behavior and alt text are defined
// once instead of four times, and swapping in a real logo file later only
// means setting data/site.json's `logo` field.
//
// Sizing is deliberately left to CSS (.brand-logo-img, scoped per
// placement in style.css) rather than different image files per spot, per
// the "topbar-sized in nav, larger in footer" requirement.

const TEXT_MARK = "Klande<span>&middot;</span>stina";

/**
 * @param {Object} site - from data/site.json
 * @returns {string} HTML to place inside an existing brand-mark container
 *   (#brand-mark, .mobile-topbar-brand, .mobile-nav-brand, .footer-logo —
 *   each already carries the right position/font-size for the text
 *   fallback; this only fills what's inside it).
 */
export function brandLogoHTML(site) {
  if (!site || !site.logo) return TEXT_MARK;

  // If the logo file is missing or fails to decode, onerror swaps the
  // broken <img> for the exact same text mark the site always used — a
  // missing/renamed logo file degrades to the old look instead of leaving
  // a broken-image icon or an empty gap in the nav/footer.
  const escapedFallback = TEXT_MARK.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  return `<img class="brand-logo-img" src="${site.logo}" alt="Klandestina" onerror="this.outerHTML='${escapedFallback}'">`;
}
