// eventModal.js
// "Special Events or Inquiry" modal — a plain HTML form that builds a
// mailto: link from the field values on submit and hands off to the
// visitor's own email client. No backend, no network call, no validation
// beyond native HTML5 required attributes; the modal just closes once the
// mailto link fires.

/**
 * Renders the (initially hidden) modal into the given container and wires
 * up its open/close/submit behavior. Call once at startup; use
 * openEventModal()/closeEventModal() to control it from anywhere else
 * (the Visit-section button and the floating FAB both call openEventModal
 * rather than each rendering their own modal).
 * @param {HTMLElement} container
 * @param {Object} opts
 * @param {string} opts.email - address the mailto: link is sent to
 */
export function renderEventModal(container, { email }) {
  container.innerHTML = `
    <div class="modal-overlay" id="event-modal" hidden>
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
        <button type="button" class="modal-close" aria-label="Close" data-close-modal>&times;</button>
        <h3 id="event-modal-title" data-i18n="eventModal.title">Special Events or Inquiry</h3>
        <p class="modal-sub" data-i18n="eventModal.subtitle">Tell us the basics and we'll open your email with everything ready to send.</p>
        <form id="event-form" class="modal-form">
          <label>
            <span data-i18n="eventModal.eventTypeLabel">Event type</span>
            <select name="eventType" required>
              <option value="" disabled selected data-i18n="eventModal.eventTypePlaceholder">Choose an event type…</option>
              <option value="Birthday" data-i18n="eventModal.eventTypeBirthday">Birthday</option>
              <option value="Private Party" data-i18n="eventModal.eventTypePrivateParty">Private Party</option>
              <option value="Corporate Event" data-i18n="eventModal.eventTypeCorporate">Corporate Event</option>
              <option value="Anniversary" data-i18n="eventModal.eventTypeAnniversary">Anniversary</option>
              <option value="Other" data-i18n="eventModal.eventTypeOther">Other</option>
            </select>
          </label>
          <label id="event-type-other-wrap" hidden>
            <span data-i18n="eventModal.eventTypeOtherLabel">Please specify</span>
            <input
              type="text" name="eventTypeOther"
              placeholder="Tell us more..."
              data-i18n-placeholder="eventModal.eventTypeOtherPlaceholder"
            >
          </label>
          <label>
            <span data-i18n="eventModal.dateLabel">Preferred date</span>
            <input type="date" name="preferredDate" required>
          </label>
          <label>
            <span data-i18n="eventModal.guestsLabel">Number of guests</span>
            <input type="number" name="guests" min="1" required>
          </label>
          <label>
            <span data-i18n="eventModal.detailsLabel">Additional details</span>
            <textarea name="details" rows="4"></textarea>
          </label>
          <button type="submit" class="btn btn-primary" data-i18n="eventModal.submit">Send Inquiry</button>
        </form>
      </div>
    </div>
  `;

  const modal = container.querySelector("#event-modal");
  const form = container.querySelector("#event-form");
  const eventTypeSelect = form.querySelector('select[name="eventType"]');
  const otherWrap = form.querySelector("#event-type-other-wrap");
  const otherInput = form.querySelector('input[name="eventTypeOther"]');

  modal.addEventListener("click", (event) => {
    if (event.target === modal || event.target.closest("[data-close-modal]")) closeEventModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closeEventModal();
  });

  // Reveal the "please specify" field only for the Other option, and make
  // it required only while it's actually showing.
  eventTypeSelect.addEventListener("change", () => {
    const isOther = eventTypeSelect.value === "Other";
    otherWrap.hidden = !isOther;
    otherInput.required = isOther;
  });

  // form.reset() (called after a successful submit, below) fires a native
  // "reset" event — use it to also collapse the Other field back down,
  // since resetting field VALUES doesn't touch the hidden/required state
  // this component manages itself.
  form.addEventListener("reset", () => {
    otherWrap.hidden = true;
    otherInput.required = false;
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);

    const eventType = data.get("eventType");
    const eventTypeLine =
      eventType === "Other" ? `Event type: Other — ${data.get("eventTypeOther")}` : `Event type: ${eventType}`;

    const subject = "Special Event Inquiry - Klandestina";
    const body = [
      eventTypeLine,
      `Preferred date: ${data.get("preferredDate")}`,
      `Guests: ${data.get("guests")}`,
      `Details: ${data.get("details")}`
    ].join("\n");

    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    form.reset();
    closeEventModal();
  });
}

export function openEventModal() {
  const modal = document.getElementById("event-modal");
  if (!modal) return;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
}

export function closeEventModal() {
  const modal = document.getElementById("event-modal");
  if (!modal) return;
  modal.hidden = true;
  document.body.style.overflow = "";
}
