// button.js
// One universal 3D button. Every button on the site (Reserve, See Menu, etc.)
// is created by this same function so the raised/press/hover effect is
// identical everywhere and only defined once.

/**
 * @param {Object} opts
 * @param {string} opts.label
 * @param {string} opts.href
 * @param {"primary"|"ghost"} [opts.style="primary"]
 * @param {boolean} [opts.newTab=false]
 * @param {string} [opts.i18nKey]  - dot-path into the i18n dict; lets the
 *                                   translation pass relabel this button
 *                                   without script.js re-creating it
 * @returns {HTMLAnchorElement}
 */
export function renderButton({ label, href, style = "primary", newTab = false, i18nKey }) {
  const a = document.createElement("a");
  a.href = href;
  a.className = `btn btn-${style}`;
  a.textContent = label;
  if (i18nKey) a.dataset.i18n = i18nKey;
  if (newTab) {
    a.target = "_blank";
    a.rel = "noopener";
  }
  return a;
}
