// googleReviews.js
// Visit section's Google reviews row — a star + one line, then "Read our
// Google reviews"/"Leave a review" buttons, both linking straight out to
// Google. No review text, star counts or ratings are shown or fetched
// here — just the two links, built entirely from data/site.json's
// googleReviewsUrl/googleWriteReviewUrl. Either button is left out if its
// own URL is empty; the whole row renders nothing if both are, same
// "hide rather than show a half-empty cluster" rule other optional
// sections (Gallery/Events) already follow.
//
// Re-rendered on every language switch (script.js calls this again, same
// as map.js) rather than using data-i18n hooks — this component doesn't
// know about i18n itself, same split map.js/footer.js already follow.

const STAR_ICON = `
  <svg class="visit-google-star" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 3.5l2.6 5.6 6.1.6-4.6 4.1 1.4 6-5.5-3.3-5.5 3.3 1.4-6-4.6-4.1 6.1-.6z"></path>
  </svg>`;

/**
 * @param {HTMLElement} container
 * @param {Object} opts
 * @param {string} opts.reviewsUrl - site.json's googleReviewsUrl, or ""
 * @param {string} opts.writeReviewUrl - site.json's googleWriteReviewUrl, or ""
 * @param {string} opts.lead - pre-translated "Loved by guests..." line
 * @param {string} opts.readLabel - pre-translated "Read our Google reviews"
 * @param {string} opts.writeLabel - pre-translated "Leave a review"
 */
export function renderGoogleReviews(container, { reviewsUrl, writeReviewUrl, lead, readLabel, writeLabel }) {
  if (!reviewsUrl && !writeReviewUrl) {
    container.innerHTML = "";
    return;
  }

  const readBtn = reviewsUrl
    ? `<a class="btn btn-ghost" href="${reviewsUrl}" target="_blank" rel="noopener noreferrer">${readLabel}</a>`
    : "";
  const writeBtn = writeReviewUrl
    ? `<a class="btn btn-ghost" href="${writeReviewUrl}" target="_blank" rel="noopener noreferrer">${writeLabel}</a>`
    : "";

  container.innerHTML = `
    <p class="visit-google-lead">${STAR_ICON}<span>${lead}</span></p>
    <div class="visit-google-actions">${readBtn}${writeBtn}</div>`;
}
