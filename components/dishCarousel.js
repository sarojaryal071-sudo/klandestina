// dishCarousel.js
// A single continuously auto-scrolling row of dish cards — the same
// component and behavior at every screen size, not a desktop grid that
// turns into a different mobile carousel. The row loops seamlessly: the
// card list is rendered twice back-to-back, and a requestAnimationFrame
// loop advances a translateX offset that wraps from the end of the first
// copy back to 0 — since the second copy is pixel-identical to the first,
// the wrap is invisible.
//
// A rAF loop (rather than a CSS @keyframes animation) is what makes the
// optional prev/next arrows possible: they just nudge the same `offset`
// value the auto-scroll loop already owns, so a manual click and the
// ongoing auto-scroll can't fight each other or desync.

import { renderDishCard } from "./dishCard.js";

const PIXELS_PER_SECOND = 32;

/**
 * @param {HTMLElement} container
 * @param {Object[]} dishes - dish objects ready for renderDishCard (description already resolved to a plain string)
 * @param {Object} [t] - optional {prev, next} label strings for the arrow buttons' aria-labels
 */
export function renderDishCarousel(container, dishes, labels = {}) {
  container.innerHTML = `
    <div class="dish-carousel">
      <div class="dish-carousel-track"></div>
      <button type="button" class="carousel-arrow carousel-arrow--prev" aria-label="${labels.prev || "Previous dish"}" data-i18n-aria-label="dishCarousel.prev">&lsaquo;</button>
      <button type="button" class="carousel-arrow carousel-arrow--next" aria-label="${labels.next || "Next dish"}" data-i18n-aria-label="dishCarousel.next">&rsaquo;</button>
    </div>
  `;

  const track = container.querySelector(".dish-carousel-track");

  // Two identical sets, back-to-back. Each is display:contents (see
  // style.css) so it groups for aria-hidden without becoming a flex item
  // itself — the individual cards inside are still the track's direct
  // flex children. The reveal-on-scroll class dish cards normally carry
  // is dropped here: these cards don't "enter" the page one at a time the
  // way a vertical list does, and continuously moving cards under a
  // scroll-linked reveal animation invites flicker for no benefit.
  [false, true].forEach((isDuplicate) => {
    const set = document.createElement("div");
    set.className = "dish-carousel-set";
    if (isDuplicate) set.setAttribute("aria-hidden", "true");
    dishes.forEach((dish) => {
      const card = renderDishCard(dish);
      card.classList.remove("reveal");
      set.appendChild(card);
    });
    track.appendChild(set);
  });

  let offset = 0;
  let paused = false;
  let setWidth = 0;
  let lastTs = null;

  // renderSignatureDishes() calls this again on every language switch,
  // replacing #dish-grid's contents wholesale — which would otherwise
  // leave this render's rAF loop and resize listener running forever in
  // the background, pointing at a track element that's no longer in the
  // document. Both self-terminate the moment that happens instead.
  function measure() {
    if (!document.body.contains(track)) {
      window.removeEventListener("resize", measure);
      return;
    }
    // Half the track's full scrollWidth, since it holds two identical sets.
    setWidth = track.scrollWidth / 2;
  }
  measure();
  window.addEventListener("resize", measure);

  function apply() {
    track.style.transform = `translateX(${-offset}px)`;
  }

  function tick(ts) {
    if (!document.body.contains(track)) return;
    if (lastTs == null) lastTs = ts;
    const dt = (ts - lastTs) / 1000;
    lastTs = ts;
    if (!paused && setWidth > 0) {
      offset = (offset + PIXELS_PER_SECOND * dt) % setWidth;
      apply();
    }
    requestAnimationFrame(tick);
  }

  // Respects prefers-reduced-motion by simply never starting the loop —
  // the row sits still, and the arrows (wired below regardless) are still
  // a fully working way to browse it.
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    requestAnimationFrame(tick);

    function pause() {
      paused = true;
    }
    function resume() {
      paused = false;
      lastTs = null; // drop the paused interval so dt doesn't include it
    }

    // pointerenter/leave cover hover (desktop); pointerdown/up cover a
    // touch press-and-release (mobile) — pause whenever either is active.
    track.addEventListener("pointerenter", pause);
    track.addEventListener("pointerleave", resume);
    track.addEventListener("pointerdown", pause);
    track.addEventListener("pointerup", resume);
    track.addEventListener("pointercancel", resume);
  }

  function step(direction) {
    if (setWidth === 0) return;
    const card = track.querySelector(".tilt-frame");
    const cardStep = card ? card.getBoundingClientRect().width + 16 : 256; // 16px = the track's own gap
    offset = (offset + direction * cardStep + setWidth) % setWidth;
    apply();
  }

  container.querySelector(".carousel-arrow--prev").addEventListener("click", () => step(-1));
  container.querySelector(".carousel-arrow--next").addEventListener("click", () => step(1));
}
