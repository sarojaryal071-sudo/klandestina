// footer.js
// One-off footer render (appears once at the bottom of the page). Labels
// carry data-i18n hooks so script.js's translation pass can relabel them;
// the data straight from site.json (address, email, hours) isn't translated.

/**
 * @param {HTMLElement} container
 * @param {Object} site  - from data/site.json
 */
export function renderFooter(container, site) {
  container.innerHTML = `
    <footer>
      <div class="container footer-grid">
        <div>
          <div class="footer-logo">Klande<span>&middot;</span>stina</div>
          <span data-i18n="footer.tagline">${site.tagline}</span>
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
