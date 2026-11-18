// faqSection.js
// Renders the FAQ accordion from an already-resolved list of {question,
// answerHtml} pairs (script.js picks each to the active language and
// fills its answer template — see faqLogic.js — before handing it
// here, same "components don't know about i18n" split as every other
// section). Plain native <details>/<summary> — no JS for the open/close
// behavior itself, this only builds the markup.

/**
 * @param {HTMLElement} container
 * @param {Array<{id: string, question: string, answerHtml: string}>} items
 */
export function renderFaqSection(container, items) {
  container.innerHTML = items.map(renderItem).join("\n");
}

function renderItem({ question, answerHtml }) {
  return `
    <details class="faq-item">
      <summary class="faq-summary">
        <span class="faq-question">${question}</span>
        <span class="faq-icon" aria-hidden="true"></span>
      </summary>
      <div class="faq-answer"><p>${answerHtml}</p></div>
    </details>`;
}
