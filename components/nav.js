// nav.js
// The floating shortcut pill nav. Appears once, so it's a one-off render
// function rather than something stamped out repeatedly like dishCard.js.

const SECTIONS = [
  { id: "story", label: "Story" },
  { id: "menu", label: "Menu" },
  { id: "gallery", label: "Gallery" },
  { id: "visit", label: "Visit" }
];

/**
 * Renders the pill nav into the given container and wires up click-to-scroll
 * plus active-state highlighting.
 * @param {HTMLElement} container
 */
export function renderNav(container) {
  container.innerHTML = SECTIONS.map(
    (s) => `<a href="#${s.id}" data-section="${s.id}"><span class="pill-fill"></span>${s.label}</a>`
  ).join("");

  setActive(container, SECTIONS[0].id);

  container.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setActive(container, link.dataset.section));
  });
}

function setActive(container, id) {
  container.querySelectorAll("a").forEach((link) => {
    link.classList.toggle("active", link.dataset.section === id);
  });
}
