// mobileNav.js
// Mobile-only (<=900px) full-screen section nav, opened via a hamburger
// button in the mobile topbar. Exists because the desktop pill nav
// (components/nav.js, #shortcut-nav) is hidden below 900px with nothing
// standing in for it, and the menu now has enough categories that jumping
// straight to a section matters on mobile too.
//
// Links are plain <a href="#id"> anchors, same as the desktop nav — the
// smooth-scroll itself is just html { scroll-behavior: smooth } in
// style.css, so clicking a link closes the overlay and lets the browser's
// own anchor jump handle the scroll; no extra scroll logic to duplicate.

const SECTIONS = [
  { id: "hero", i18n: "mobileNav.home", label: "Home" },
  { id: "story", i18n: "nav.story", label: "Story" },
  { id: "menu", i18n: "nav.menu", label: "Menu" },
  { id: "gallery", i18n: "nav.gallery", label: "Gallery" },
  { id: "visit", i18n: "mobileNav.visit", label: "Find Us" }
];

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

  overlayContainer.innerHTML = `
    <div class="mobile-nav-overlay" id="mobile-nav-overlay" hidden>
      <button
        type="button" class="mobile-nav-close" aria-label="Close menu" data-i18n-aria-label="mobileNav.closeLabel"
      >&times;</button>
      <nav class="mobile-nav-links">
        ${SECTIONS.map((s) => `<a href="#${s.id}" data-i18n="${s.i18n}">${s.label}</a>`).join("")}
      </nav>
    </div>
  `;

  const toggle = toggleContainer.querySelector(".mobile-nav-toggle");
  const overlay = overlayContainer.querySelector("#mobile-nav-overlay");

  function open() {
    overlay.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  function close() {
    overlay.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  toggle.addEventListener("click", open);
  overlay.querySelector(".mobile-nav-close").addEventListener("click", close);
  overlay.querySelectorAll(".mobile-nav-links a").forEach((link) => {
    link.addEventListener("click", close);
  });
}
