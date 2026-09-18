// themeToggle.js
// Sun/moon icon button that flips the site between the dark (default) and
// light theme. Both icons are always in the DOM; style.css shows whichever
// one represents the theme a click would switch TO, keyed off the
// <html data-theme> attribute script.js maintains.

/**
 * @param {HTMLElement} container
 * @param {() => void} onToggle
 */
export function renderThemeToggle(container, onToggle) {
  container.innerHTML = `
    <button type="button" class="theme-toggle" aria-label="Toggle light/dark theme">
      <svg class="icon-sun" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8L6 18M18 6l1.8-1.8"></path>
      </svg>
      <svg class="icon-moon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 1 0 10.5 10.5Z"></path>
      </svg>
    </button>
  `;

  container.querySelector(".theme-toggle").addEventListener("click", onToggle);
}
