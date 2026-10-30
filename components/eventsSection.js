// eventsSection.js
// Renders the Events section's card grid from an already-resolved,
// already-sorted list of upcoming events (see eventsLogic.js's
// resolveUpcomingEvents() — script.js is the one that calls it and
// hands this component the result, same "components don't know about
// i18n or date math" split as every other section). The soonest
// occurrence always renders as a larger "Up next" hero card with the
// brass accent; every card gets a "Tonight" badge when its own
// occurrence is happening now or still due to start later today.

import { helsinkiDateParts } from "./eventsLogic.js";

/**
 * @param {HTMLElement} container
 * @param {Array<{event: Object, occurrence: {start: Date, end: Date|null}}>} resolved
 *   - event fields (title/description/tag/price) already picked to the active language (plain strings)
 * @param {Object} labels
 * @param {string} labels.upNext
 * @param {string} labels.tonight
 * @param {string[]} labels.weekdayShort - 7 short labels, index 0 = Monday, matching eventsLogic's weekday numbering
 */
export function renderEventsSection(container, resolved, labels) {
  if (resolved.length === 0) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = resolved
    .map((entry, index) => renderCard(entry, index === 0, labels))
    .join("");
}

function renderCard({ event, occurrence, isTonight }, isHero, labels) {
  const parts = helsinkiDateParts(occurrence.start);
  const weekday = labels.weekdayShort[(parts.weekday - 1 + 7) % 7];
  const timeRange = formatTimeRange(event.startTime, event.endTime);
  const image = event.image
    ? `<img class="event-image" src="/images/events/${event.image}" alt="" loading="lazy" decoding="async">`
    : "";

  return `
    <article class="event-card${isHero ? " event-card--hero" : ""}">
      <div class="event-date">
        <span class="event-date-weekday">${weekday}</span>
        <span class="event-date-day">${parts.d}</span>
      </div>
      <div class="event-body">
        <div class="event-top">
          <h3 class="event-title">${event.title}</h3>
          ${isHero ? `<span class="event-upnext">${labels.upNext}</span>` : ""}
          ${isTonight ? `<span class="event-badge">${labels.tonight}</span>` : ""}
        </div>
        ${timeRange ? `<p class="event-time">${timeRange}</p>` : ""}
        <p class="event-desc">${event.description}</p>
        <div class="event-meta">
          ${event.tag ? `<span class="event-tag">${event.tag}</span>` : ""}
          ${event.price ? `<span class="event-price">${event.price}</span>` : ""}
        </div>
      </div>
      ${image}
    </article>`;
}

function formatTimeRange(startTime, endTime) {
  if (!startTime) return "";
  if (!endTime) return startTime;
  return `${startTime}–${endTime}`;
}
