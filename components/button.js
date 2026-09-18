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
 * @returns {HTMLAnchorElement}
 */
export function renderButton({ label, href, style = "primary", newTab = false }) {
  const a = document.createElement("a");
  a.href = href;
  a.className = `btn btn-${style}`;
  a.textContent = label;
  if (newTab) {
    a.target = "_blank";
    a.rel = "noopener";
  }
  return a;
}
