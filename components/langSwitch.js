// langSwitch.js
// Plain-text EN / FI / ES language switcher, rendered once near the
// shortcut nav. Clicking a language hands its code to onSelect; script.js
// owns actually applying the change.

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "fi", label: "FI" },
  { code: "es", label: "ES" }
];

/**
 * @param {HTMLElement} container
 * @param {string} activeLang
 * @param {(code: string) => void} onSelect
 */
export function renderLangSwitch(container, activeLang, onSelect) {
  container.innerHTML = LANGUAGES.map(
    (l, i) =>
      `${i > 0 ? '<span class="lang-sep">/</span>' : ""}<button type="button" class="lang-option" data-lang="${l.code}">${l.label}</button>`
  ).join("");

  setActiveLang(container, activeLang);

  container.querySelectorAll(".lang-option").forEach((btn) => {
    btn.addEventListener("click", () => onSelect(btn.dataset.lang));
  });
}

export function setActiveLang(container, lang) {
  container.querySelectorAll(".lang-option").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
}
