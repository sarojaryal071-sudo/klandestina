// itemModal.js
// Click-to-expand detail modal shared by every menu item row (menuItem.js)
// and every signature dish card (dishCard.js) — one modal instance, one
// rendering path, opened with the same plain item shape
// ({ name, price, allergens, description, image, images }) regardless of
// which of the two list styles it was clicked from.
//
// Reuses the Special-Event-Inquiry modal's .modal-overlay/.modal-close
// treatment (style.css) for the close button and overlay/backdrop, so the
// two modals read as the same system rather than two different ones.

import { renderPrice } from "./priceDisplay.js";
import { dishImageSizeAttrs } from "./dishImageDims.js";

// Fallback copy for the no-photo/no-description states below — the
// component itself doesn't know about i18n (same split footer.js/
// dishCarousel.js follow), so script.js hands in the active language's
// resolved strings once at init and again on every language switch.
let fallbackStrings = { noPhoto: "", noDescription: "" };
export function setItemModalStrings(strings) {
  fallbackStrings = strings;
}

// The element that opened the modal (a menu row or dish card) — focus
// returns to it on close, per standard dialog a11y practice, instead of
// being dropped back onto <body>.
let triggerEl = null;

// Close plays a ~160ms exit animation (style.css's --closing class)
// before the modal actually disappears — closeItemModal() defers the
// real teardown (hiding it, unlocking scroll, returning focus) to the
// end of that animation via this timer, tracked so a rapid re-open
// (clicking a new dish before the previous close finished) can cancel a
// stale teardown instead of racing it.
let closeTimer = null;
const CLOSE_MS = 160;

// Scroll lock: instead of overflow:hidden on body alone (which iOS Safari
// happily ignores for touch-scrolling the page behind a fixed overlay),
// body is pinned with position:fixed at its negative current scroll
// offset — the one combination that actually blocks background scroll on
// iOS — then restored to the exact same offset on close via
// window.scrollTo rather than letting the browser pick wherever
// position:fixed's removal leaves it. The vanished scrollbar would
// otherwise shift all fixed-width content sideways by its width for as
// long as the modal is open; compensating with that same width as
// padding-right keeps the page from visibly shifting.
let savedScrollY = 0;

function lockBodyScroll() {
  savedScrollY = window.scrollY;
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.position = "fixed";
  document.body.style.top = `-${savedScrollY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
  if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
}

function unlockBodyScroll() {
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";
  document.body.style.paddingRight = "";
  // "instant", not the site's global smooth-scroll default (style.css's
  // html { scroll-behavior: smooth }) — restoring position is a snap back
  // to where the visitor actually was, not a scroll they should watch
  // happen.
  window.scrollTo({ top: savedScrollY, left: 0, behavior: "instant" });
}

// All natively-focusable, visible elements inside the modal, in DOM order
// — used both to move focus in on open and to cycle Tab/Shift+Tab inside
// it on its own (trapFocus below) while it's open.
function getFocusable(modal) {
  return Array.from(modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(
    (el) => !el.disabled && el.offsetParent !== null
  );
}

function trapFocus(event) {
  const modal = document.getElementById("item-modal");
  if (event.key !== "Tab" || !modal || modal.hidden) return;
  const focusable = getFocusable(modal);
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export function renderItemModal(container) {
  container.innerHTML = `
    <div class="modal-overlay item-modal-overlay" id="item-modal" hidden>
      <div class="modal-card item-modal-card" role="dialog" aria-modal="true" aria-labelledby="item-modal-title">
        <button
          type="button" class="modal-close item-modal-close" aria-label="Close"
          data-i18n-aria-label="itemModal.closeLabel" data-close-modal
        >&times;</button>
        <div class="item-modal-photo" id="item-modal-photo"></div>
        <div class="item-modal-thumbs" id="item-modal-thumbs" hidden></div>
        <div class="item-modal-body">
          <div class="item-modal-top">
            <h3 id="item-modal-title"></h3>
            <span class="menu-item-tag" id="item-modal-tag" hidden></span>
          </div>
          <p class="item-modal-desc" id="item-modal-desc" hidden></p>
          <div id="item-modal-price"></div>
        </div>
      </div>
    </div>
  `;

  const modal = container.querySelector("#item-modal");

  // Backdrop click closes, but only when BOTH the press and the release
  // land directly on the backdrop itself — not just the release. A plain
  // `click` listener checking only event.target would also fire for a
  // swipe/drag that starts inside the card (e.g. scrolling its
  // description) and ends up outside the card's box on release, since a
  // native click still targets whatever's under the pointer at the end
  // of the gesture regardless of where it started.
  let pressedBackdrop = false;
  modal.addEventListener("pointerdown", (event) => {
    pressedBackdrop = event.target === modal;
  });
  modal.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-modal]")) {
      closeItemModal();
    } else if (event.target === modal && pressedBackdrop) {
      closeItemModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closeItemModal();
  });
  document.addEventListener("keydown", trapFocus);
}

/**
 * @param {Object} item
 * @param {string} item.name
 * @param {string[]} [item.allergens]
 * @param {string} item.description  - already resolved to the active language's plain string
 * @param {string|Object} item.price - same shape renderMenuItem's price accepts (plain string, "", or a wine object)
 * @param {string} [item.image]      - filename inside images/dishes/, used when item.images isn't set
 * @param {string[]} [item.images]   - optional multi-photo set for the gallery; falls back to [item.image]
 * @param {HTMLElement} [openedFrom] - the row/card that was clicked/activated to open this modal;
 *   focus returns to it on close instead of being dropped onto <body>.
 */
export function openItemModal(item, openedFrom) {
  const modal = document.getElementById("item-modal");
  if (!modal) return;

  // A new dish clicked while the previous one was still mid-close-
  // animation (modal.hidden is still false during that window) — cancel
  // the stale teardown rather than letting it fire later and undo state
  // (unlock scroll, return focus to the OLD trigger) this fresh open is
  // about to set up.
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
  modal.classList.remove("item-modal-overlay--closing");

  triggerEl = openedFrom || null;

  modal.querySelector("#item-modal-title").textContent = item.name;

  const tagEl = modal.querySelector("#item-modal-tag");
  const allergenLabel = item.allergens && item.allergens.length ? item.allergens.join(" · ") : "";
  tagEl.textContent = allergenLabel;
  tagEl.hidden = !allergenLabel;

  // Never a silently empty box: a genuinely missing description shows the
  // same fallback copy a missing photo does below, rather than hiding the
  // paragraph outright and leaving unexplained whitespace.
  const descEl = modal.querySelector("#item-modal-desc");
  descEl.textContent = item.description || fallbackStrings.noDescription;
  descEl.classList.toggle("item-modal-desc--fallback", !item.description);
  descEl.hidden = false;

  modal.querySelector("#item-modal-price").innerHTML = renderPrice(item.price);

  const images = item.images && item.images.length ? item.images : item.image ? [item.image] : [];
  renderGallery(modal, images, item.name);

  // Already open (a new dish clicked while this one, or a mid-close one,
  // was showing) — the scroll lock from that still-active session is
  // already in place; re-locking here would re-read window.scrollY while
  // the page is already pinned via position:fixed (always 0 in that
  // state) and clobber the real saved offset closeItemModal() needs to
  // restore later.
  const alreadyOpen = !modal.hidden;
  modal.hidden = false;
  if (!alreadyOpen) lockBodyScroll();

  // Move focus into the dialog — its own close button, the one control
  // guaranteed to exist regardless of whether this item has a photo
  // gallery or thumbnail strip.
  modal.querySelector(".item-modal-close").focus();
}

// A large primary photo, plus — only when the item actually has more than
// one — a small tappable thumbnail strip underneath it to browse the rest
// (a signature dish like Quesabirria has both quesabirria.jpg and
// quesabirria-2.jpg via its "images" array in data/menu.json; most items
// still just have a single "image" and never show a strip at all). No
// matching photo at all falls back to a small stylized accent-glow strip
// instead of a broken-image icon.
function renderGallery(modal, images, itemName) {
  const photoWrap = modal.querySelector("#item-modal-photo");
  const thumbsWrap = modal.querySelector("#item-modal-thumbs");

  if (images.length === 0) {
    photoWrap.className = "item-modal-photo item-modal-photo--empty";
    photoWrap.innerHTML = `
      <img class="item-modal-photo-mark" src="/images/logo/badge.png" alt="" aria-hidden="true">
      <span class="item-modal-photo-empty-text">${fallbackStrings.noPhoto}</span>`;
    thumbsWrap.hidden = true;
    thumbsWrap.innerHTML = "";
    return;
  }

  photoWrap.className = "item-modal-photo";
  const setPrimary = (file) => {
    photoWrap.innerHTML = `
      <img
        src="/images/dishes/${file}" alt="${itemName}" loading="lazy"${dishImageSizeAttrs(file)}
        onerror="this.parentElement.classList.add('item-modal-photo--empty'); this.remove();"
      >`;
  };
  setPrimary(images[0]);

  if (images.length > 1) {
    thumbsWrap.hidden = false;
    thumbsWrap.innerHTML = images
      .map(
        (file, i) => `
          <button
            type="button" class="item-modal-thumb${i === 0 ? " item-modal-thumb--active" : ""}"
            data-file="${file}" aria-label="Photo ${i + 1}"
          >
            <img src="/images/dishes/${file}" alt="${itemName} — photo ${i + 1}" loading="lazy"${dishImageSizeAttrs(file)}>
          </button>`
      )
      .join("");

    thumbsWrap.querySelectorAll(".item-modal-thumb").forEach((thumbBtn) => {
      thumbBtn.addEventListener("click", () => {
        thumbsWrap.querySelectorAll(".item-modal-thumb").forEach((el) => el.classList.remove("item-modal-thumb--active"));
        thumbBtn.classList.add("item-modal-thumb--active");
        photoWrap.className = "item-modal-photo";
        setPrimary(thumbBtn.dataset.file);
      });
    });
  } else {
    thumbsWrap.hidden = true;
    thumbsWrap.innerHTML = "";
  }
}

export function closeItemModal() {
  const modal = document.getElementById("item-modal");
  if (!modal || modal.hidden || closeTimer) return;

  // Plays the exit animation (style.css) first — modal.hidden only flips
  // once it's actually finished, so the card is still there to animate
  // rather than vanishing instantly out from under it.
  modal.classList.add("item-modal-overlay--closing");
  closeTimer = window.setTimeout(() => {
    modal.hidden = true;
    modal.classList.remove("item-modal-overlay--closing");
    closeTimer = null;
    unlockBodyScroll();

    if (triggerEl && document.body.contains(triggerEl)) triggerEl.focus();
    triggerEl = null;
  }, CLOSE_MS);
}
