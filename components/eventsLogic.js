// eventsLogic.js
// Pure date/time math for data/events.json — no DOM, so it's imported
// both by script.js (the live page) and scripts/prerender.mjs (Node),
// same split as components/dishImageDims.js. Everything here works in
// Europe/Helsinki wall-clock time regardless of the machine's own
// timezone (a visitor's browser, or CI running in UTC), using the
// Intl API rather than a date library, since that's already built into
// both runtimes.

const TIME_ZONE = "Europe/Helsinki";

// The offset (in ms) of `timeZone` from UTC at the instant `date`
// represents: format that instant's wall-clock reading in `timeZone`,
// re-interpret those same numbers AS IF they were UTC, and subtract the
// real UTC instant. Standard Intl-only timezone-offset trick — no
// timezone database shipped, the environment's own ICU data supplies it.
function tzOffsetMs(date, timeZone) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
  const parts = dtf.formatToParts(date).reduce((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - date.getTime();
}

// Converts a Helsinki-local wall-clock date+time into the real UTC
// instant it refers to. Guesses using the offset near that instant, then
// refines once against the guess's own offset — enough to be correct
// except exactly at the two-minute DST-transition instant itself, which
// never coincides with a restaurant's evening event times.
function helsinkiToUTC(y, m, d, hh, mm) {
  const naiveUtcMs = Date.UTC(y, m - 1, d, hh, mm, 0);
  let offset = tzOffsetMs(new Date(naiveUtcMs), TIME_ZONE);
  let utcMs = naiveUtcMs - offset;
  offset = tzOffsetMs(new Date(utcMs), TIME_ZONE);
  utcMs = naiveUtcMs - offset;
  return new Date(utcMs);
}

// Helsinki wall-clock reading of a UTC instant: date parts + ISO weekday
// (Monday=1 ... Sunday=7, matching events.json's own `weekday` field so
// "Friday=5" means the same thing in data as it does here).
export function helsinkiDateParts(date) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", weekday: "short"
  });
  const parts = dtf.formatToParts(date).reduce((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
  const WEEKDAY_MAP = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  return {
    y: +parts.year, m: +parts.month, d: +parts.day,
    hh: +parts.hour, mm: +parts.minute,
    weekday: WEEKDAY_MAP[parts.weekday]
  };
}

function parseHM(str) {
  const [hh, mm] = str.split(":").map(Number);
  return { hh, mm };
}

// Adds `days` calendar days to a Helsinki y/m/d triple — plain UTC-noon
// arithmetic is enough here since we only ever carry the date fields
// forward, never the time-of-day, through this step.
function addDays(y, m, d, days) {
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  dt.setUTCDate(dt.getUTCDate() + days);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

function dateKey(y, m, d) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// Builds the {start, end} instants (both real UTC Dates) for one
// occurrence given its Helsinki calendar date and optional start/end
// times. `end` is null when the event has no stated end time at all
// (an all-day/unspecified-time one-off, e.g. Halloween with no time
// given). When endTime's clock value is numerically <= startTime's,
// that means the event runs past midnight, so end lands on the
// following calendar date.
function occurrenceWindow(y, m, d, startTime, endTime) {
  const start = startTime ? helsinkiToUTC(y, m, d, parseHM(startTime).hh, parseHM(startTime).mm) : helsinkiToUTC(y, m, d, 0, 0);
  if (!endTime) return { start, end: null };
  const s = startTime ? parseHM(startTime) : { hh: 0, mm: 0 };
  const e = parseHM(endTime);
  const spansMidnight = e.hh * 60 + e.mm <= s.hh * 60 + s.mm;
  const endDate = spansMidnight ? addDays(y, m, d, 1) : { y, m, d };
  const end = helsinkiToUTC(endDate.y, endDate.m, endDate.d, e.hh, e.mm);
  return { start, end };
}

// The event's next (or currently ongoing) occurrence relative to `now`
// (a real Date, defaults to the current instant) — or null for a
// one-off whose date (and, if it has one, end time) has already fully
// passed. "Ongoing" is deliberately treated the same as "next": a
// Friday-night event running past midnight keeps reporting ITS OWN
// start instant (now in the past) rather than jumping ahead to next
// Friday the moment the calendar date changes — see events.json's own
// comment and the task's "counts as tonight until its end time" rule.
export function nextOccurrence(event, now = new Date()) {
  const nowParts = helsinkiDateParts(now);

  if (event.type === "oneoff") {
    const [y, m, d] = event.date.split("-").map(Number);
    const window = occurrenceWindow(y, m, d, event.startTime, event.endTime);
    const effectiveEnd = window.end || window.start;
    // No time at all given: stays visible through its whole calendar
    // date (Helsinki), not just until midnight-as-an-instant.
    const stillToday = !event.startTime && dateKey(y, m, d) === dateKey(nowParts.y, nowParts.m, nowParts.d);
    if (stillToday || effectiveEnd.getTime() > now.getTime()) return window;
    return null;
  }

  // Recurring: check yesterday's, today's, and the next 7 days' worth of
  // candidates for this weekday, and return the earliest one whose
  // window hasn't fully ended yet. Checking yesterday first is what
  // catches "it's 00:40 Saturday, Friday's karaoke is still going".
  for (let offset = -1; offset <= 7; offset++) {
    const { y, m, d } = addDays(nowParts.y, nowParts.m, nowParts.d, offset);
    const candidateWeekday = ((nowParts.weekday - 1 + offset) % 7 + 7) % 7 + 1;
    if (candidateWeekday !== event.weekday) continue;
    const window = occurrenceWindow(y, m, d, event.startTime, event.endTime);
    const effectiveEnd = window.end || window.start;
    if (effectiveEnd.getTime() > now.getTime()) return window;
  }
  return null; // unreachable in practice (a weekly event always matches within 7 days)
}

// True while an occurrence is either happening right now or still due to
// start later on today's Helsinki calendar date — shared by isTonight()
// and resolveUpcomingEvents() below so both use exactly one definition.
function occurrenceIsTonight(occurrence, now) {
  const effectiveEnd = (occurrence.end || occurrence.start).getTime();
  if (now.getTime() >= occurrence.start.getTime() && now.getTime() < effectiveEnd) return true; // ongoing
  const nowParts = helsinkiDateParts(now);
  const startParts = helsinkiDateParts(occurrence.start);
  return dateKey(startParts.y, startParts.m, startParts.d) === dateKey(nowParts.y, nowParts.m, nowParts.d);
}

// True while `event`'s occurrence is either happening right now or still
// due to start later on today's Helsinki calendar date.
export function isTonight(event, now = new Date()) {
  const occ = nextOccurrence(event, now);
  return occ ? occurrenceIsTonight(occ, now) : false;
}

// Resolves every event's next occurrence, drops the ones that no longer
// have one (expired one-offs), and sorts by how soon that occurrence
// starts — the only ordering the Events section ever shows. Each result
// also carries isTonight so callers (the rendering components, the
// prerender script) never need to re-derive it themselves.
export function resolveUpcomingEvents(events, now = new Date()) {
  return events
    .map((event) => {
      const occurrence = nextOccurrence(event, now);
      return occurrence && { event, occurrence, isTonight: occurrenceIsTonight(occurrence, now) };
    })
    .filter(Boolean)
    .sort((a, b) => a.occurrence.start.getTime() - b.occurrence.start.getTime());
}
