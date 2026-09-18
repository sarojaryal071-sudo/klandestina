// footer.js
// One-off footer render (appears once at the bottom of the page). Labels
// carry data-i18n hooks so script.js's translation pass can relabel them;
// the data straight from site.json (address, email, hours) isn't translated.

// Hand-drawn to match the site's own stroke-icon language (theme toggle's
// sun/moon, the FAB's calendar) rather than importing official brand SVGs —
// same reasoning as the custom CSS map pin instead of a raster logo.
const SOCIAL_ICONS = {
  instagram: `
    <rect x="3" y="3" width="18" height="18" rx="5"></rect>
    <circle cx="12" cy="12" r="4"></circle>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>`,
  facebook: `
    <circle cx="12" cy="12" r="9"></circle>
    <path d="M13.5 16.5V12H15l.4-2.2h-1.9V8.4c0-.6.2-1 .9-1H15V5.2C14.7 5.1 14 5 13.2 5c-1.7 0-2.9 1.1-2.9 3v1.8H8.5V12h1.8v4.5"></path>`,
  tiktok: `
    <path d="M15 3v10.5a3.5 3.5 0 1 1-3-3.47"></path>
    <path d="M15 3c.4 2.3 2 4.1 4.3 4.4"></path>`
};

/**
 * @param {HTMLElement} container
 * @param {Object} site  - from data/site.json
 */
export function renderFooter(container, site) {
  const socialLinks = Object.entries(site.social || {})
    .map(([platform, url]) => {
      const icon = SOCIAL_ICONS[platform];
      if (!icon || !url) return "";
      const label = platform.charAt(0).toUpperCase() + platform.slice(1);
      return `
        <a
          class="footer-social-link" href="${url}" target="_blank" rel="noopener noreferrer"
          aria-label="${label}" data-i18n-aria-label="footer.social.${platform}"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>
        </a>`;
    })
    .join("");

  container.innerHTML = `
    <footer>
      <div class="container footer-grid">
        <div>
          <div class="footer-logo">Klande<span>&middot;</span>stina</div>
          <span data-i18n="footer.tagline">${site.tagline}</span>
          <div class="footer-social">${socialLinks}</div>
        </div>
        <div class="footer-col">
          <h4 data-i18n="footer.visitLabel">Visit</h4>
          <span>${site.address}</span>
          <span>${site.email}</span>
        </div>
        <div class="footer-col">
          <h4 data-i18n="footer.hoursLabel">Hours</h4>
          ${site.hours.map((h) => `<span>${h}</span>`).join("")}
        </div>
      </div>
      <div class="container footer-bottom">
        <span>&copy; ${new Date().getFullYear()} Klandestina. <span data-i18n="footer.rights">All rights reserved.</span></span>
      </div>
    </footer>
  `;
}
