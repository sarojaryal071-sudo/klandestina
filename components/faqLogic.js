// faqLogic.js
// Resolves one data/faq.json answer template — static prose that may
// contain {{hours}}/{{phone}}/{{email}} placeholders — against
// data/site.json, so those facts can never disagree with the footer.
// Shared between script.js (browser) and scripts/prerender.mjs (Node),
// same split as hoursLogic.js/eventsLogic.js.

import { formatHoursLines } from "./hoursLogic.js";

// Open-day lines only, in the footer's own grouping/formatting — a
// closed day is covered by the answer template's own "Closed on
// Sundays"-style sentence instead, so this filters formatHoursLines()'s
// result down to the groups that aren't closed, rather than re-deriving
// the grouping itself.
function openHoursLines(site, dict) {
  const closedWord = dict.hours.closed;
  return formatHoursLines(site.hours, { dayNames: dict.hours.days, closedWord }).filter(
    (line) => !line.endsWith(closedWord)
  );
}

/**
 * @param {string} template - one faq.json answer string, already picked to the active language
 * @param {Object} site - data/site.json
 * @param {Object} dict - the active language's data/i18n/*.json dict (for hours.days/hours.closed)
 */
export function resolveFaqAnswer(template, site, dict) {
  if (!template.includes("{{")) return template;
  return template
    .replace("{{hours}}", openHoursLines(site, dict).join("<br>"))
    .replace("{{phone}}", site.phone.display)
    .replace("{{email}}", site.email);
}
