// fab.js
// Persistent floating action button — fixed bottom-right on every section
// of the page, independent of the top-anchored mobile topbar/utility bar.
// Opens the exact same "Special Events or Inquiry" modal as the button in
// the Visit section; script.js wires both triggers to the same
// openEventModal() function rather than this rendering its own modal.

/**
 * @param {HTMLElement} container
 * @param {() => void} onClick
 */
export function renderFab(container, onClick) {
  container.innerHTML = `
    <button type="button" class="fab" aria-label="Special Events or Inquiry" data-i18n-aria-label="fab.ariaLabel">
      <span class="fab-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="5" width="18" height="16" rx="3"></rect>
          <path d="M3 10h18M8 3v4M16 3v4M12 14v4M10 16h4"></path>
        </svg>
      </span>
      <span class="fab-label" data-i18n="fab.label">Special Event</span>
    </button>
  `;

  container.querySelector(".fab").addEventListener("click", onClick);
}
