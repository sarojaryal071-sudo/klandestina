// mobileNav.js
// Mobile-only (<=900px) full-screen section nav, opened via a hamburger
// button in the mobile topbar. Exists because the desktop pill nav
// (components/nav.js, #shortcut-nav) is hidden below 900px with nothing
// standing in for it, and the menu now has enough categories that jumping
// straight to a section matters on mobile too.
//
// Visually it borrows straight from the rest of the site rather than
// being its own thing: the wordmark markup is footer.js's "Klande·stina"
// treatment, and each link's hover/tap state is nav.js's pill-fill
// pattern (a <span class="pill-fill"> sibling next to the translated
// label span, not on the label itself, so applyTranslations() re-setting
// the label's textContent never wipes the pill-fill span out).

const SECTIONS = [
  { id: "hero", i18n: "mobileNav.home", label: "Home" },
  { id: "story", i18n: "nav.story", label: "Story" },
  { id: "menu", i18n: "nav.menu", label: "Menu" },
  { id: "gallery", i18n: "nav.gallery", label: "Gallery" },
  { id: "visit", i18n: "mobileNav.visit", label: "Find Us" }
];

// style.css's @keyframes mobileNavOut runs for 0.2s — kept in sync here so
// a link click can wait for the close animation to finish before actually
// scrolling, instead of cutting straight to the target section mid-close.
const CLOSE_MS = 200;

/**
 * @param {HTMLElement} toggleContainer - mounted inside the mobile topbar
 * @param {HTMLElement} overlayContainer - mounted once, anywhere in the body
 */
export function renderMobileNav(toggleContainer, overlayContainer) {
  toggleContainer.innerHTML = `
    <button
      type="button" class="mobile-nav-toggle" aria-expanded="false" aria-controls="mobile-nav-overlay"
      aria-label="Open menu" data-i18n-aria-label="mobileNav.openLabel"
    >☰</button>
  `;

  const linksHtml = SECTIONS.map(
    (s, i) => `
      <a href="#${s.id}" data-section="${s.id}" style="animation-delay:${60 + i * 50}ms">
        <span class="pill-fill"></span>
        <span data-i18n="${s.i18n}">${s.label}</span>
      </a>`
  ).join('<div class="mobile-nav-divider" aria-hidden="true"></div>');

  overlayContainer.innerHTML = `
    <div class="mobile-nav-overlay" id="mobile-nav-overlay" hidden>
      <button
        type="button" class="mobile-nav-close" aria-label="Close menu" data-i18n-aria-label="mobileNav.closeLabel"
      >&times;</button>
      <div class="mobile-nav-brand">Klande<span>&middot;</span>stina</div>
      <nav class="mobile-nav-links">${linksHtml}</nav>
    </div>
  `;

  const toggle = toggleContainer.querySelector(".mobile-nav-toggle");
  const overlay = overlayContainer.querySelector("#mobile-nav-overlay");

  function open() {
    overlay.hidden = false;
    overlay.classList.remove("mobile-nav-overlay--closing");
    overlay.classList.add("mobile-nav-overlay--open");
    toggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  // Plays the exit animation, then (once it's actually finished, not
  // before) removes the overlay from layout/a11y. onDone fires at that
  // same point — used by link clicks to delay the scroll until the
  // overlay has visibly closed, rather than jumping the page underneath
  // it mid-animation.
  function close(onDone) {
    overlay.classList.remove("mobile-nav-overlay--open");
    overlay.classList.add("mobile-nav-overlay--closing");
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    window.setTimeout(() => {
      overlay.hidden = true;
      overlay.classList.remove("mobile-nav-overlay--closing");
      if (onDone) onDone();
    }, CLOSE_MS);
  }

  toggle.addEventListener("click", open);
  overlay.querySelector(".mobile-nav-close").addEventListener("click", () => close());
  overlay.querySelectorAll(".mobile-nav-links a").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const target = document.getElementById(link.dataset.section);
      close(() => target?.scrollIntoView({ behavior: "smooth", block: "start" }));
    });
  });
}
