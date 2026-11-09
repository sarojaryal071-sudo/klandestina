// dishCarousel.js
// A single continuously auto-scrolling row of dish cards — the same
// component and behavior at every screen size, not a desktop grid that
// turns into a different mobile carousel. The row loops seamlessly: the
// card list is rendered several times back-to-back (see "How many
// copies?" below), and a requestAnimationFrame loop advances a translateX
// offset that's always wrapped into [0, setWidth) — since every copy is
// pixel-identical, wrapping the offset never produces a visible jump.
//
// A rAF loop (rather than a CSS @keyframes animation) is what makes
// prev/next, drag, wheel, and keyboard stepping all possible without
// fighting the autoplay: they all just nudge the same `offset` value the
// auto-scroll loop already owns, through the same wrap() helper, so
// nothing can desync.
//
// How many copies? Two copies (the original bug here) is only enough to
// cover a visible window up to one full set wide. .full-bleed makes the
// visible window the whole viewport, and there are only 6 signature
// dishes (~256px each) — on anything wider than about 1536px (an
// ultrawide monitor, or just a maximized window), the viewport outgrows
// two sets, and once the translateX offset nears the wrap point the
// window reads past the end of the second copy into nothing: a blank
// track, exactly the reported bug. syncCloneCount() below sizes the
// clone count to the actual viewport instead of a fixed 2, so this can't
// recur at any width or with any (even very short) dish count.

import { renderDishCard } from "./dishCard.js";

const PIXELS_PER_SECOND = 32;

/**
 * @param {HTMLElement} container
 * @param {Object[]} dishes - dish objects ready for renderDishCard (description already resolved to a plain string)
 * @param {Object} [t] - optional {prev, next} label strings for the arrow buttons' aria-labels
 * @param {number} [startOffset] - resume the loop from this translateX offset instead of 0 — used on a
 *                                  language switch, where script.js re-calls this (dish descriptions are
 *                                  per-language, so the DOM has to be rebuilt) but wants the auto-scroll
 *                                  loop to keep going from where it was rather than visibly snapping back
 *                                  to the start. The returned handle's getOffset() is how the caller reads
 *                                  the value back out beforehand. Unaffected by the clone count below —
 *                                  offset is always a position within exactly one set's width, regardless
 *                                  of how many copies of it are currently rendered.
 * @returns {{ getOffset: () => number }}
 */
export function renderDishCarousel(container, dishes, labels = {}, startOffset = 0) {
  container.innerHTML = `
    <div class="dish-carousel">
      <div class="dish-carousel-track"></div>
      <button type="button" class="carousel-arrow carousel-arrow--prev" aria-label="${labels.prev || "Previous dish"}" data-i18n-aria-label="dishCarousel.prev">&lsaquo;</button>
      <button type="button" class="carousel-arrow carousel-arrow--next" aria-label="${labels.next || "Next dish"}" data-i18n-aria-label="dishCarousel.next">&rsaquo;</button>
    </div>
  `;

  const carousel = container.querySelector(".dish-carousel");
  const track = container.querySelector(".dish-carousel-track");

  // Each set is display:contents (see style.css) so it groups for
  // aria-hidden without becoming a flex item itself — the individual
  // cards inside are still the track's direct flex children. The
  // reveal-on-scroll class dish cards normally carry is dropped here:
  // these cards don't "enter" the page one at a time the way a vertical
  // list does, and continuously moving cards under a scroll-linked reveal
  // animation invites flicker for no benefit. Every set past the first is
  // a clone: aria-hidden (screen readers should never reach it) and its
  // cards de-tabbed (aria-hidden alone doesn't remove an element from the
  // keyboard Tab order, and without this, tabbing through the row would
  // visit the same dish's clickable card once per clone). A clone's card
  // still opens the real item modal for the same dish on click — it's a
  // full, independent renderDishCard() instance, not a shallow visual
  // copy, so that wiring just comes for free.
  function buildSet(isClone) {
    const set = document.createElement("div");
    set.className = "dish-carousel-set";
    if (isClone) set.setAttribute("aria-hidden", "true");
    dishes.forEach((dish) => {
      const card = renderDishCard(dish);
      card.classList.remove("reveal");
      if (isClone) card.querySelector(".dish-visual")?.setAttribute("tabindex", "-1");
      set.appendChild(card);
    });
    return set;
  }

  let offset = startOffset;
  let copies = 1;
  let lastTs = null;

  // The real set is built exactly once and never touched again — only
  // clone sets are added or removed as the viewport changes (below), so
  // a resize never re-creates (and re-decodes the images of) the cards
  // actually reachable by Tab/assistive tech.
  track.appendChild(buildSet(false));
  const setWidth = track.scrollWidth;

  function wrap(value) {
    if (setWidth === 0) return 0;
    // The extra "+ setWidth, % setWidth" handles a negative value
    // correctly — JS's % keeps the sign of its left operand, so a plain
    // `value % setWidth` on a negative value (a drag or a prev-step past
    // 0) returns a negative result instead of wrapping forward.
    return ((value % setWidth) + setWidth) % setWidth;
  }

  function apply() {
    track.style.transform = `translateX(${-offset}px)`;
  }

  // Keeps enough clone sets in the track to cover any reachable window:
  // offset only ever ranges within [0, setWidth), so the furthest a
  // window can reach is setWidth + one viewport width. copies =
  // ceil(viewport / setWidth) + 2 gives that plus a full extra set of
  // slack on top (comfortably more than "one extra card" on each side).
  // Called once up front and again on resize/orientation change; a
  // shrinking viewport trims clones back down rather than leaving them
  // (harmless, just wasted DOM) sitting unused forever.
  function syncCloneCount() {
    if (!document.body.contains(track)) {
      window.removeEventListener("resize", onResize);
      return;
    }
    if (setWidth === 0) return; // no dishes — nothing to clone, carousel just sits empty

    const style = getComputedStyle(carousel);
    // clientWidth includes the carousel's own left/right padding —
    // subtract it to get the actual unclipped (overflow:hidden) viewport
    // the track is visible through, not the padded box around it.
    const viewportWidth = carousel.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const needed = Math.max(2, Math.ceil(viewportWidth / setWidth) + 2);

    while (copies < needed) {
      track.appendChild(buildSet(true));
      copies++;
    }
    while (copies > needed) {
      track.lastElementChild.remove();
      copies--;
    }

    offset = wrap(offset);
    apply();
  }

  syncCloneCount();

  // Debounced: a window drag-resize fires many times a second, and
  // walking the clone count on every single one is wasted work — worth
  // collapsing to one sync after the resize actually settles.
  let resizeTimer = null;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(syncCloneCount, 150);
  }
  window.addEventListener("resize", onResize);

  function tick(ts) {
    if (!document.body.contains(track)) return;
    if (lastTs == null) lastTs = ts;
    const dt = (ts - lastTs) / 1000;
    lastTs = ts;
    if (pauseReasons.size === 0 && setWidth > 0) {
      offset = wrap(offset + PIXELS_PER_SECOND * dt);
      apply();
    }
    requestAnimationFrame(tick);
  }

  // Autoplay pauses for any of several independent reasons at once (e.g.
  // a touch press while the tab is also momentarily hidden) — tracked as
  // a set rather than one boolean so one reason clearing doesn't resume
  // the loop while another is still active.
  const pauseReasons = new Set();
  function pause(reason) {
    pauseReasons.add(reason);
  }
  function resume(reason) {
    pauseReasons.delete(reason);
    if (pauseReasons.size === 0) lastTs = null; // drop the paused interval so dt doesn't include it
  }

  // Respects prefers-reduced-motion by simply never starting the loop —
  // the row sits still, and arrows/drag/wheel/keyboard (wired below
  // regardless) are still a fully working way to browse it.
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    requestAnimationFrame(tick);

    // Hover (desktop) and keyboard focus anywhere in the carousel (an
    // arrow or a card).
    carousel.addEventListener("pointerenter", () => pause("hover"));
    carousel.addEventListener("pointerleave", () => resume("hover"));
    carousel.addEventListener("focusin", () => pause("focus"));
    carousel.addEventListener("focusout", (event) => {
      if (!carousel.contains(event.relatedTarget)) resume("focus");
    });

    // The page tab itself going into the background — a carousel nobody
    // can see has no reason to keep animating (or to come back having
    // silently drifted while hidden).
    function onVisibilityChange() {
      if (!document.body.contains(track)) {
        document.removeEventListener("visibilitychange", onVisibilityChange);
        return;
      }
      if (document.hidden) pause("hidden");
      else resume("hidden");
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
  }

  function cardStep() {
    const card = track.querySelector(".tilt-frame");
    return card ? card.getBoundingClientRect().width + 16 : 256; // 16px = the track's own gap
  }

  function step(direction) {
    if (setWidth === 0) return;
    offset = wrap(offset + direction * cardStep());
    apply();
  }

  container.querySelector(".carousel-arrow--prev").addEventListener("click", () => step(-1));
  container.querySelector(".carousel-arrow--next").addEventListener("click", () => step(1));

  // Keyboard: left/right only act while focus is actually inside the
  // carousel (an arrow button or a card), same scope as the focus pause
  // above — a visitor tabbed elsewhere on the page shouldn't have their
  // arrow keys hijacked by a carousel they've left.
  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    }
  });

  // Pointer drag — one code path for mouse-drag, touch-swipe, and pen,
  // via the Pointer Events API rather than separate mouse/touch handlers.
  // setPointerCapture keeps receiving pointermove even if the pointer
  // strays outside the track mid-drag (fast swipes routinely do).
  let dragPointerId = null;
  let dragStartX = 0;
  let dragStartOffset = 0;
  let dragMoved = false; // past a small threshold — see the click suppression below

  track.addEventListener("pointerdown", (event) => {
    dragPointerId = event.pointerId;
    dragStartX = event.clientX;
    dragStartOffset = offset;
    dragMoved = false;
    pause("drag");
    track.setPointerCapture(event.pointerId);
  });
  track.addEventListener("pointermove", (event) => {
    if (event.pointerId !== dragPointerId) return;
    // Dragging left (finger/cursor moves toward negative X) should reveal
    // what's next, same direction autoplay already moves — so a leftward
    // drag (negative delta) needs to INCREASE offset, hence the flip.
    const delta = dragStartX - event.clientX;
    if (Math.abs(delta) > 5) dragMoved = true;
    offset = wrap(dragStartOffset + delta);
    apply();
  });
  function endDrag(event) {
    if (event.pointerId !== dragPointerId) return;
    dragPointerId = null;
    resume("drag");
  }
  track.addEventListener("pointerup", endDrag);
  track.addEventListener("pointercancel", endDrag);

  // A real drag still ends with a native click firing on whatever card is
  // under the pointer at release — without this, dragging the strip via a
  // card would also pop that card's modal open right as the drag ends.
  // Capture phase so this runs before the card's own (bubble-phase) click
  // listener in dishCard.js.
  track.addEventListener(
    "click",
    (event) => {
      if (dragMoved) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true
  );

  // Trackpad horizontal swipe. Only a horizontal-dominant wheel gesture
  // is treated as "scroll the carousel" — a normal vertical mouse-wheel
  // scroll over the row (nudging the page, not this component) is left
  // alone. "Scrolling right" (positive deltaX) advances the same
  // direction as autoplay/drag, matching ordinary page horizontal-scroll
  // convention, so no sign flip is needed here.
  let wheelResumeTimer = null;
  track.addEventListener(
    "wheel",
    (event) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      offset = wrap(offset + event.deltaX);
      apply();
      pause("wheel");
      clearTimeout(wheelResumeTimer);
      wheelResumeTimer = setTimeout(() => resume("wheel"), 400);
    },
    { passive: false }
  );

  return { getOffset: () => offset };
}
