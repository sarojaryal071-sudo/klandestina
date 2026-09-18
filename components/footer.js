// footer.js
// One-off footer render (appears once at the bottom of the page).

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
          <span>${site.tagline}</span>
        </div>
        <div class="footer-col">
          <h4>Visit</h4>
          <span>${site.address}</span>
          <span>${site.email}</span>
        </div>
        <div class="footer-col">
          <h4>Hours</h4>
          ${site.hours.map((h) => `<span>${h}</span>`).join("")}
        </div>
      </div>
      <div class="container footer-bottom">
        <span>&copy; ${new Date().getFullYear()} Klandestina. All rights reserved.</span>
      </div>
    </footer>
  `;
}
