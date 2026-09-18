# Klandestina — Website

Plain HTML/CSS/JS site for Klandestina Cantina, Helsinki. No build step, no framework — open `index.html` in a browser (or serve the folder) and it runs.

## Editing the menu

Everything a dish needs — name, price, description, photo — lives in `data/menu.json`. Edit that file and the site updates automatically; no other file needs to change.

The full menu is split into `lunch`, `starters`, `tacos`, `chilaquiles`, `desserts`, `softDrinks`, `beer`, `cocktails`, `wine`, matching the real physical menu boards. `menu.categories` drives the tab row; most tabs map straight to one of those arrays, except `drinks`, which lists `groups: ["softDrinks","beer","cocktails","wine"]` and renders each as its own labeled sub-section in one panel (keeps the tab row to 6 pills instead of 9).

Per-item fields:
- `allergens`: raw letter codes as printed on the menu (`["M","G"]`, `["VEGAN"]`, etc.) — plain display text next to the name, not interactive. **The G/M/L legend itself needs confirming with the owner** — the menu photos show the letters but not what they stand for, so I've stored them as-is without guessing (G/M/L conventionally mean gluten/dairy/lactose-adjacent allergens on European menus, but I didn't want to assert that without the owner's key).
- `price`: usually a string (`"€15"`); `""` for items covered by a category-level price note instead (Lunch's fixed €14.90); or, for wine only, an object `{ glass12, glass16, glass24, bottle }` with `null` for sizes not offered — rendered as a fixed-width 4-column grid (12cl/16cl/24cl/Btl line up in the same columns on every wine row), still plain text.
- `image`: filename inside `images/dishes/`, only set on items that actually have a real dish photo. Omitting it isn't a gap to fill in later — `renderMenuItem()` treats a missing `image` as "this item has no thumbnail" and renders name/description/price full-width with no image area at all, rather than a placeholder square.
- `description`: `{ en, fi }`. Cocktail modifiers ("With Mezcal: +2€") and the Amazing Bowl's choose-your-sides/filling text are folded into this as plain prose, not separate interactive fields — nothing on the menu beyond the existing category tabs is clickable.
- A group can carry a standing note above its items via `data/i18n/*.json`'s `menu.notes.<groupId>` (used for Lunch's price/schedule line and Cocktails' "ask about Tequila & Mezcal" line).

## File structure

- `index.html` — page skeleton and section order
- `style.css` — all visual styling
- `script.js` — loads data, calls each component, wires up interactions
- `components/` — one reusable "template" per repeating piece (dish card, menu row, gallery tile, button) plus one-off pieces (nav, mobile nav overlay, footer, language switcher, theme toggle, the special-event modal, the FAB)
- `data/menu.json` — dishes and full menu content
- `data/site.json` — address, hours, reservation link, socials
- `data/i18n/` — `en.json` / `fi.json`, one matching set of UI-chrome translation keys each
- `images/` — photos, organized by section (`hero/`, `dishes/`, `gallery/`, `logo/`)

## Status

Working prototype with the real menu (lunch, à la carte, drinks — see below), a scattered-photo gallery, scroll-spy nav highlighting, horizontal swipeable dish cards on mobile, dish thumbnails in the full menu list (text-only rows for items with no real photo — see below), an EN/FI language switcher, a dark/light theme toggle, floating-tile dish cards (smaller, gapped, rounded, theme-aware shadow via `--card-shadow`), an auto-hiding mobile topbar with a hamburger-triggered full-screen section nav, and a "Special Events or Inquiry" modal (see below), reachable both from the Visit section and a persistent floating action button. Scroll-reveal and tilt-hover are CSS-only and already active.

## Special events or inquiry

The "Special Events or Inquiry" action opens a modal (`components/eventModal.js`) with a plain form — event type, preferred date, guest count, details. It's reachable two ways: the primary (filled) button in the Visit section, listed ahead of the now-secondary (ghost) "Reserve a Table" button, and a persistent floating action button (`components/fab.js`) fixed to the bottom-right corner of every section. Both triggers call the same exported `openEventModal()` — there's only ever one modal instance in the DOM, not two.

Event type is a `<select>` (Birthday / Private Party / Corporate Event / Anniversary / Other) rather than free text, since a dropdown covers the realistic cases with less typing; selecting "Other" reveals a small text input for the visitor to specify, which is only included in the mailto body when Other is actually chosen (`Event type: Other — [their text]`; otherwise just `Event type: <selected>`). On submit the form builds a `mailto:` link from the field values (no backend, no network call) and hands off to the visitor's own email client via `window.location.href`, then closes. A plain-text fallback line under the Visit-section buttons spells out the email address directly, in case the visitor's device has no mail client configured and the mailto link does nothing visible.

The FAB sits at `bottom: 24px; right: 24px` (`z-index: 90`, below the modal's 100 but above ordinary content) — independent of the top-anchored `.shortcut-nav`/`.utility-bar`/`.mobile-topbar`, so the two never compete for space. Below 720px it drops its text label and becomes a plain 52px circular icon button, matching the site's tactile "3D" button shadow language at any size.

## Menu row layout

`components/menuItem.js` stacks every row the same way regardless of category: name (free to wrap to multiple lines), then description, then price, one under the other — never sharing a line with the name. That's what makes wine's four-column price grid (and any other long name) line up cleanly instead of fighting for horizontal space or ending up vertically off-center against wrapped text. Only items with a real `image` in `data/menu.json` get a thumbnail; everything else renders text-only, full-width, with no placeholder box.

## Mobile navigation

Below 900px, the desktop pill nav (`#shortcut-nav`) is hidden and has nothing standing in for it except the hamburger button in the mobile topbar (`components/mobileNav.js`). Tapping it opens a full-screen overlay — Home / Story / Menu / Gallery / Find Us — styled to match the site (Bebas Neue links, accent hover, respects the current theme). The links are plain `<a href="#id">` anchors, same as the desktop nav, so the smooth-scroll on click is just the site-wide `scroll-behavior: smooth`, not separate JS; clicking a link closes the overlay immediately, so the visitor watches the page scroll to the section behind it. Scoped to `<=900px` only — both a `@media (min-width: 901px)` CSS guard and the fact that the toggle only exists inside the (itself hidden-above-900px) mobile topbar keep desktop nav behavior untouched.

## Editing translations

UI chrome (nav, hero, section headings, story/visit copy, footer, the event modal) lives in `data/i18n/en.json`, `fi.json` — same keys in each file. Menu item `description` fields in `data/menu.json` are `{ "en": ..., "fi": ... }` objects; dish/item *names* stay untranslated on purpose (they're already Spanish). `script.js` resolves everything by the active language at render time. (Spanish was dropped as a site language — the site only needs EN/FI now — though dish/item names being Spanish already is unrelated to that and hasn't changed.)

## Theme

Dark is the default palette. Light theme's CSS variables live in the `:root[data-theme="light"]` block in `style.css`. `script.js` sets the visitor's initial theme from `prefers-color-scheme` (via a small inline script in `index.html`'s `<head>`, so there's no flash of the wrong theme), then remembers a manual toggle in `localStorage`.

Known gaps:
- The `gallery` array in `data/menu.json` currently reuses the dish photos from `images/dishes/` as filler — real interior/atmosphere photos for `images/gallery/` are still needed.
- **FI translations are AI-generated** (by Claude) and should be reviewed by a native speaker before real launch — both for accuracy and for tone.
- **The G/M/L allergen legend needs confirming with the owner** (see "Editing the menu" above) — codes are stored exactly as printed, meaning is not asserted.
- **Two menu items have an item-level gap from illegible/uncertain source photos, flagged rather than guessed:**
  - Lunch's "Sea Bass in Mango Salsa" had an allergen code in parentheses that's obscured by glare in the photo — stored with an empty `allergens` array; worth re-checking against the physical menu.
  - Wine's "House Sparkling Wine" — read as `12cl €10 / 16cl — / 24cl — / bottle €36` (only one glass size offered), but that part of the photo also has glare across it — worth double-checking that reading against the physical menu or POS.
- Menu **thumbnails use 12px rounded squares**, not circles, to stay consistent with the rounded-square treatment already used everywhere else images appear (dish cards, gallery tiles). Only a handful of items have real photos (the ones that already had dish photography); the rest — most of tacos, all of chilaquiles/desserts/drinks/wine — render as text-only rows with no thumbnail at all (see "Menu row layout" above) rather than a placeholder box, since a blank tinted square read as a broken image more than an intentional design choice.
- **Story section copy was rewritten from the owner's own "About Klandestina" text** (photographed board), replacing the previous entirely-invented placeholder copy (including a fabricated "— Andrés, chef & owner" quote attribution, which has been removed — the real source has no attributed name). Kept the section's existing visual treatment (centered text + an accent pull-quote box) since that's what the section actually has today; it does not currently have a full-bleed background photo, so none was added — happy to build that as a separate, explicit layout change if wanted. Two things from the source text are flagged rather than guessed at:
  - **"Harju Kallio"** is used verbatim as printed — I can't independently confirm whether this is meant as one place name, a reference to "Harjutori" (a square in Helsinki's Kallio district), or something else.
  - **"two and a half years"** is a relative duration with no anchor date on the source material — used verbatim to match the real text, but as permanent website copy it will silently become inaccurate as time passes. Worth deciding whether to replace it with an absolute year/date range, or accept it needs periodic manual updating.
- Several previously-hardcoded colors (muted text opacities, button/tab "3D" shadow tones, the floating nav's glass background) were converted to theme-aware `color-mix()`/CSS-variable expressions so they'd read correctly in both themes; a few — the dark gradient scrim behind photo captions, and the caption text sitting on top of it — were deliberately left theme-independent, since they overlay photographs rather than the page background and need to stay legible regardless of site theme.
- `favicon.ico` is referenced in `index.html` but still doesn't exist in the repo (pre-existing gap, unrelated to this pass) — the browser tab will show a generic icon until one is added.
- **Dish card sizing landed at a 240px floor rather than an exact half.** A literal halving (doubling the grid column count) turned out to be unsafe with the existing caption font sizes/padding: at narrower widths some captions (especially the longer ones, like the `PLACEHOLDER — need description/ingredients` entries) needed more vertical room than the fixed 3:4 image aspect ratio + `overflow: hidden` could give them, so text was getting silently clipped. `.dish-grid` now uses `repeat(auto-fit, minmax(240px, 1fr))` — tiles hold a safe minimum width and the grid adds more columns (or wraps rows) as space allows, rather than being forced narrower than their content can support. 240px is roughly 55–60% of the prior 3-column width, not an exact half, chosen empirically (tested across viewport widths from 901px to 1920px) as the smallest size with no caption overflow. The mobile carousel's card width was changed from a `78vw` relative value to a fixed `240px` for the same reason and for consistency with the desktop floor. Also added `flex-wrap: wrap` to `.dish-top` (name/price row) — at the smaller card width, a long price like `€PLACEHOLDER` could otherwise overlap the wrapped dish name instead of dropping to its own line.
- **Mobile topbar (<=900px).** A fixed bar (reusing `.shortcut-nav`'s glass/blur styling) replaces the desktop's separate `#brand-mark` + `.utility-bar` on small screens, holding the wordmark, language switch, and theme toggle in one row. It auto-hides on scroll down and reappears on scroll up (`script.js`, `initMobileTopbarAutoHide`, 8px threshold to avoid jitter). Implementation note: the language switch and theme toggle are genuinely rendered twice (`#lang-switch`/`#theme-toggle` for desktop, `#mobile-lang-switch`/`#mobile-theme-toggle` for the topbar) rather than one instance being moved around — simpler and more robust than reparenting fixed-position elements across a breakpoint. They stay in sync automatically: the theme icon swap is pure CSS keyed off `<html data-theme>`, and `setLanguage()` updates both lang-switch instances' active state on every change.
- **Dish carousel edge padding.** The "no gap between cards" report turned out to be the mobile carousel's edge whitespace (56px, inherited from the section's own padding) dwarfing the 16px gap between cards — same gap everywhere, but the asymmetry read as "only a gap at the edges." Fixed by having `.dish-grid` bleed out of the section's padding (`margin: 0 -56px`) and back in with edge padding matching the inter-card gap (`padding: 0 16px`) instead. Verified the actual gap value directly (not just visually) — every consecutive pair of cards measured exactly 16px apart both before and after this fix.
- **Gallery is now a scattered "scrapbook"** (`display: flex; flex-wrap: wrap`, not `grid`) — six rotation/offset variants cycling by `nth-child`, negative horizontal margins for overlap, hover straightens the tile and lifts it with its own shadow (overrides the site-wide 3D tilt-hover via higher CSS specificity, since that effect would otherwise fight the tile's own base rotation instead of countering it back toward flat). Still uses the existing dish photos as filler.
- **"Find Us" section is now CTA-only** — heading + Reserve button. Address/hours/contact live in the footer alone now; removed the now-unused `visit.addressLabel`/`hoursLabel`/`contactLabel` i18n keys and `.visit-grid`/`.visit-col` CSS along with it.
