// eventModal.js
// "Special Events or Inquiry" modal. The form drafts one message (To/
// Subject/body) from the field values on submit; what happens next
// depends on the device, since a plain mailto: link works well on a
// phone but does nothing (or shows an ugly protocol prompt) on most
// desktops with no email client configured:
//   - touch devices: still fire the mailto: (via a hidden anchor click,
//     not a real navigation) as a best-effort auto-open, then show the
//     confirmation panel as a fallback/backup.
//   - desktop (fine pointer): skip the mailto attempt entirely and go
//     straight to the confirmation panel.
// The confirmation panel (replacing the form inside the same card, not
// a new modal) never claims the message was sent or says "thank you" —
// the site has no way to know whether the visitor actually sent it. It
// offers a one-click "copy the whole message" step, three prefilled
// "open it in ___" links (Gmail/Outlook/the OS mailto handler), and the
// restaurant's own email/phone as a direct fallback. No backend, no
// network call, no third-party script.

const EVENT_TYPE_I18N_KEY = {
  Birthday: "eventTypeBirthday",
  "Private Party": "eventTypePrivateParty",
  "Corporate Event": "eventTypeCorporate",
  Anniversary: "eventTypeAnniversary",
  Other: "eventTypeOther"
};

function formatDateDDMMYYYY(isoDate) {
  const [y, m, d] = isoDate.split("-");
  return `${d}.${m}.${y}`;
}

// Builds the one message object (To/Subject/body) both the preview and
// every "open in ___" link are built from — translated into whatever
// language `strings` (script.js's resolved i18n strings, this component
// doesn't call t() itself — same split every other component follows)
// was captured in.
function buildMessage(data, { email, strings }) {
  const eventTypeValue = data.get("eventType");
  const eventTypeLabel =
    eventTypeValue === "Other" ? data.get("eventTypeOther") : strings.eventTypeLabels[eventTypeValue] || eventTypeValue;
  const dateDisplay = formatDateDDMMYYYY(data.get("preferredDate"));
  const details = (data.get("details") || "").trim();

  const subject = `${strings.subjectPrefix}: ${eventTypeLabel} – ${dateDisplay}`;
  const body = [
    strings.messageGreeting,
    "",
    `${strings.eventTypeLabel}: ${eventTypeLabel}`,
    `${strings.dateLabel}: ${dateDisplay}`,
    `${strings.guestsLabel}: ${data.get("guests")}`,
    `${strings.detailsLabel}: ${details || "—"}`,
    "",
    strings.messageClosing
  ].join("\n");

  return { to: email, subject, body };
}

function mailtoUrl({ to, subject, body }) {
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
function gmailUrl({ to, subject, body }) {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
function outlookUrl({ to, subject, body }) {
  return `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * @param {HTMLElement} container
 * @param {Object} opts
 * @param {string} opts.email - site.json's own address, the message's To
 * @param {Object} opts.phone - site.json's own {display, link}, for the
 *   "or write to us directly" fallback
 * @param {() => Object} opts.getStrings - returns the active language's
 *   resolved strings fresh each call (not captured once), so a message
 *   drafted after a language switch is in the right language without
 *   this component needing to re-render on switch. Keys: eventTypeLabel,
 *   eventTypeLabels ({Birthday, "Private Party", "Corporate Event",
 *   Anniversary, Other}), dateLabel, guestsLabel, detailsLabel,
 *   subjectPrefix, messageGreeting, messageClosing, confirmHeading,
 *   confirmIntro, confirmHeadingTouch, confirmIntroTouch, previewToLabel,
 *   previewSubjectLabel, copyButton, copyButtonDone, copyAnnounce,
 *   copyFallbackAnnounce, step2Intro, openInGmail, openInOutlook,
 *   openInEmailApp, directContactPrefix, backToForm.
 */
export function renderEventModal(container, { email, phone, getStrings }) {
  container.innerHTML = `
    <div class="modal-overlay" id="event-modal" hidden>
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
        <button type="button" class="modal-close" aria-label="Close" data-close-modal>&times;</button>
        <h3 id="event-modal-title" data-i18n="eventModal.title">Special Events or Inquiry</h3>
        <p class="modal-sub" id="event-form-subtitle" data-i18n="eventModal.subtitle">Tell us the basics and we'll open your email with everything ready to send.</p>
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

        <div class="event-confirm" id="event-confirm" hidden>
          <h3 class="event-confirm-heading" id="event-confirm-heading" tabindex="-1"></h3>
          <p class="modal-sub" id="event-confirm-intro"></p>

          <div class="event-confirm-preview" id="event-confirm-preview">
            <div><strong id="event-confirm-to-label"></strong> <span id="event-confirm-to"></span></div>
            <div><strong id="event-confirm-subject-label"></strong> <span id="event-confirm-subject"></span></div>
            <pre id="event-confirm-body"></pre>
          </div>
          <p class="sr-only" id="event-copy-status" aria-live="polite"></p>

          <div class="event-confirm-step">
            <span class="event-step-badge" aria-hidden="true">1</span>
            <button type="button" class="btn btn-primary" id="event-copy-btn"></button>
          </div>

          <div class="event-confirm-step">
            <span class="event-step-badge" aria-hidden="true">2</span>
            <div class="event-confirm-step-body">
              <p id="event-step2-intro"></p>
              <div class="event-confirm-email-buttons">
                <a class="btn btn-ghost" id="event-gmail-btn" target="_blank" rel="noopener"></a>
                <a class="btn btn-ghost" id="event-outlook-btn" target="_blank" rel="noopener"></a>
                <a class="btn btn-ghost" id="event-mailto-btn" target="_blank" rel="noopener"></a>
              </div>
            </div>
          </div>

          <p class="event-confirm-direct">
            <span id="event-direct-prefix"></span>
            <a id="event-direct-email" href="#"></a> &middot;
            <a id="event-direct-phone" class="tel-link" href="#"></a>
          </p>

          <button type="button" class="event-confirm-back" id="event-back-btn"></button>
        </div>
      </div>
    </div>
  `;

  const modal = container.querySelector("#event-modal");
  const form = container.querySelector("#event-form");
  const formSubtitle = container.querySelector("#event-form-subtitle");
  const confirm = container.querySelector("#event-confirm");
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

  form.addEventListener("reset", () => {
    otherWrap.hidden = true;
    otherInput.required = false;
  });

  function showConfirmation(message, { touch }) {
    const strings = getStrings();

    confirm.querySelector("#event-confirm-heading").textContent = touch ? strings.confirmHeadingTouch : strings.confirmHeading;
    confirm.querySelector("#event-confirm-intro").textContent = touch ? strings.confirmIntroTouch : strings.confirmIntro;
    confirm.querySelector("#event-confirm-to-label").textContent = strings.previewToLabel;
    confirm.querySelector("#event-confirm-to").textContent = message.to;
    confirm.querySelector("#event-confirm-subject-label").textContent = strings.previewSubjectLabel;
    confirm.querySelector("#event-confirm-subject").textContent = message.subject;
    confirm.querySelector("#event-confirm-body").textContent = message.body;

    const copyBtn = confirm.querySelector("#event-copy-btn");
    copyBtn.textContent = strings.copyButton;
    copyBtn.dataset.labelIdle = strings.copyButton;
    copyBtn.dataset.labelDone = strings.copyButtonDone;

    confirm.querySelector("#event-step2-intro").textContent = strings.step2Intro;
    confirm.querySelector("#event-gmail-btn").textContent = strings.openInGmail;
    confirm.querySelector("#event-gmail-btn").href = gmailUrl(message);
    confirm.querySelector("#event-outlook-btn").textContent = strings.openInOutlook;
    confirm.querySelector("#event-outlook-btn").href = outlookUrl(message);
    confirm.querySelector("#event-mailto-btn").textContent = strings.openInEmailApp;
    confirm.querySelector("#event-mailto-btn").href = mailtoUrl(message);

    confirm.querySelector("#event-direct-prefix").textContent = strings.directContactPrefix;
    confirm.querySelector("#event-direct-email").textContent = email;
    confirm.querySelector("#event-direct-email").href = `mailto:${email}`;
    confirm.querySelector("#event-direct-phone").textContent = phone.display;
    confirm.querySelector("#event-direct-phone").href = phone.link;

    confirm.querySelector("#event-back-btn").textContent = strings.backToForm;

    form.hidden = true;
    formSubtitle.hidden = true;
    confirm.hidden = false;

    const heading = confirm.querySelector("#event-confirm-heading");
    heading.focus();
  }

  const copyStatus = confirm.querySelector("#event-copy-status");
  let copyRevertTimer = null;
  confirm.querySelector("#event-copy-btn").addEventListener("click", async () => {
    const strings = getStrings();
    const copyBtn = confirm.querySelector("#event-copy-btn");
    const to = confirm.querySelector("#event-confirm-to").textContent;
    const subject = confirm.querySelector("#event-confirm-subject").textContent;
    const body = confirm.querySelector("#event-confirm-body").textContent;
    const fullText = `${strings.previewToLabel} ${to}\n${strings.previewSubjectLabel} ${subject}\n\n${body}`;

    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullText);
        copied = true;
      }
    } catch {
      copied = false;
    }

    if (copied) {
      copyBtn.textContent = copyBtn.dataset.labelDone;
      copyStatus.textContent = strings.copyAnnounce;
    } else {
      // Clipboard API unavailable (or blocked) — select the preview text
      // so the visitor can copy it themselves with the keyboard.
      const preview = confirm.querySelector("#event-confirm-preview");
      const range = document.createRange();
      range.selectNodeContents(preview);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      copyStatus.textContent = strings.copyFallbackAnnounce;
    }

    clearTimeout(copyRevertTimer);
    copyRevertTimer = window.setTimeout(() => {
      copyBtn.textContent = copyBtn.dataset.labelIdle;
    }, 2000);
  });

  confirm.querySelector("#event-back-btn").addEventListener("click", () => {
    confirm.hidden = true;
    form.hidden = false;
    formSubtitle.hidden = false;
    eventTypeSelect.focus();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const strings = getStrings();
    const message = buildMessage(data, { email, strings });
    const isTouch = matchMedia("(pointer: coarse)").matches;

    if (isTouch) {
      // A hidden anchor click, not window.location.href — the latter is a
      // real navigation away from the page for a scheme the browser
      // doesn't otherwise recognize as "stay put," which is exactly the
      // ugly-prompt-or-nothing behavior this rework exists to avoid on
      // desktop; a touch device's OS reliably intercepts the mailto: and
      // hands off to its mail app without actually navigating.
      const link = document.createElement("a");
      link.href = mailtoUrl(message);
      link.click();
    }

    showConfirmation(message, { touch: isTouch });
  });
}

export function openEventModal() {
  const modal = document.getElementById("event-modal");
  if (!modal) return;
  // Always reopen on the form, even if a previous visit was left on the
  // confirmation panel — re-showing someone else's half-finished message
  // would be confusing, and the fields are gone regardless.
  const form = modal.querySelector("#event-form");
  const confirm = modal.querySelector("#event-confirm");
  if (confirm && !confirm.hidden) {
    confirm.hidden = true;
    form.hidden = false;
    modal.querySelector("#event-form-subtitle").hidden = false;
    form.reset();
  }
  modal.hidden = false;
  document.body.style.overflow = "hidden";
}

export function closeEventModal() {
  const modal = document.getElementById("event-modal");
  if (!modal) return;
  modal.hidden = true;
  document.body.style.overflow = "";
}
