// hoursLogic.js
// Pure formatting over data/site.json's `hours` array — shared between
// script.js (browser) and scripts/prerender.mjs (Node), same split as
// eventsLogic.js. Each entry is { day: "mon".."sun", opens: "HH:MM",
// closes: "HH:MM" } or { day, closed: true }. closes reading "earlier"
// than opens (e.g. Friday opens "11:00", closes "01:00") means that
// day's hours run past midnight into the next calendar day — same
// convention eventsLogic.js already uses for events.

const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

// Groups consecutive days (in week order) that share identical hours (or
// are both closed) into one run — Tue/Wed/Thu all open 11:00-22:00
// becomes one "Tue-Thu" line instead of three separate ones.
export function groupHours(hours) {
  const byDay = new Map(hours.map((h) => [h.day, h]));
  const ordered = DAY_ORDER.map((day) => byDay.get(day)).filter(Boolean);

  const groups = [];
  for (const entry of ordered) {
    const prev = groups[groups.length - 1];
    const sameAsPrev =
      prev && prev.closed === Boolean(entry.closed) && prev.opens === entry.opens && prev.closes === entry.closes;
    if (sameAsPrev) {
      prev.days.push(entry.day);
    } else {
      groups.push({ days: [entry.day], closed: Boolean(entry.closed), opens: entry.opens, closes: entry.closes });
    }
  }
  return groups;
}

// dict = { dayNames: { mon: "Mon", ... }, closedWord: "Closed" } — the
// active language's data/i18n/*.json hours.days/hours.closed keys.
export function formatHoursLines(hours, dict) {
  return groupHours(hours).map((g) => {
    const first = dict.dayNames[g.days[0]];
    const last = dict.dayNames[g.days[g.days.length - 1]];
    const dayLabel = g.days.length > 1 ? `${first}–${last}` : first;
    return g.closed ? `${dayLabel} ${dict.closedWord}` : `${dayLabel} ${g.opens}–${g.closes}`;
  });
}
