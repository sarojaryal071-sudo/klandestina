# Klandestina — Website

Plain HTML/CSS/JS site for Klandestina Cantina, Helsinki. No build step, no framework — open `index.html` in a browser (or serve the folder) and it runs.

## Editing the menu

Everything a dish needs — name, price, description, photo — lives in `data/menu.json`. Edit that file and the site updates automatically; no other file needs to change.

## File structure

- `index.html` — page skeleton and section order
- `style.css` — all visual styling
- `script.js` — loads data, calls each component, wires up interactions
- `components/` — one reusable "template" per repeating piece (dish card, menu row, gallery tile, button) plus one-off pieces (nav, footer, language switcher, theme toggle)
- `data/menu.json` — dishes and full menu content
- `data/site.json` — address, hours, reservation link, socials
- `data/i18n/` — `en.json` / `fi.json` / `es.json`, one matching set of UI-chrome translation keys each
- `images/` — photos, organized by section (`hero/`, `dishes/`, `gallery/`, `logo/`)

## Status

Working prototype with: menu category tabs, gallery rendering, scroll-spy nav highlighting, horizontal swipeable dish cards on mobile, dish thumbnails in the full menu list, an EN/FI/ES language switcher, a dark/light theme toggle, and floating-tile dish/gallery cards (smaller, gapped, rounded, theme-aware shadow via `--card-shadow`). Scroll-reveal and tilt-hover are CSS-only and already active.

## Editing translations

UI chrome (nav, hero, section headings, story/visit copy, footer) lives in `data/i18n/en.json`, `fi.json`, `es.json` — same keys in each file. Menu item `description` fields in `data/menu.json` are `{ "en": ..., "fi": ..., "es": ... }` objects; dish/item *names* stay untranslated on purpose (they're already Spanish). `script.js` resolves everything by the active language at render time.

## Theme

Dark is the default palette. Light theme's CSS variables live in the `:root[data-theme="light"]` block in `style.css`. `script.js` sets the visitor's initial theme from `prefers-color-scheme` (via a small inline script in `index.html`'s `<head>`, so there's no flash of the wrong theme), then remembers a manual toggle in `localStorage`.

Known gaps:
- Several prices/descriptions in `data/menu.json` are still `€PLACEHOLDER` (pulled from a menu photo that wasn't fully legible). The placeholder marker is intentionally left as literal English text in all three languages rather than translated, since it's a to-do flag for whoever fills in the real content, not real copy.
- The `gallery` array in `data/menu.json` currently reuses the dish photos from `images/dishes/` as filler — real interior/atmosphere photos for `images/gallery/` are still needed.
- **FI and ES translations are AI-generated** (by Claude) and should be reviewed by a native speaker before real launch — both for accuracy and for tone (the site's voice is casual/confident in English; that's a harder needle to thread in a second pass of translation).
- The **Story section's copy (both paragraphs and the quote) is newly drafted placeholder content**, not text supplied by the site owner — the section was empty before this pass and needed something to translate. Written to match the established brand voice ("no sign," "a room that doesn't announce itself"), attributed to "Andrés" based on the contact email in `data/site.json`, but should be replaced with the owner's actual words before launch.
- Menu item **tags** (`V · VEGAN`, `GF`, etc.) are intentionally left untranslated — they're short, internationally-recognized menu abbreviations, and translating them seemed more likely to confuse than help.
- Menu **thumbnails use 12px rounded squares**, not circles, to stay consistent with the rounded-square treatment already used everywhere else images appear (dish cards, gallery tiles). Items without a matching photo yet (Guacachips, Prawn Salpicon) get a flat low-opacity accent-colored placeholder square instead of a broken image.
- Several previously-hardcoded colors (muted text opacities, button/tab "3D" shadow tones, the floating nav's glass background) were converted to theme-aware `color-mix()`/CSS-variable expressions so they'd read correctly in both themes; a few — the dark gradient scrim behind photo captions, and the caption text sitting on top of it — were deliberately left theme-independent, since they overlay photographs rather than the page background and need to stay legible regardless of site theme.
- `favicon.ico` is referenced in `index.html` but still doesn't exist in the repo (pre-existing gap, unrelated to this pass) — the browser tab will show a generic icon until one is added.
- **Dish/gallery card sizing landed at a 240px floor rather than an exact half.** A literal halving (doubling the grid column count) turned out to be unsafe with the existing caption font sizes/padding: at narrower widths some captions (especially the longer ones, like the `PLACEHOLDER — need description/ingredients` entries) needed more vertical room than the fixed 3:4 image aspect ratio + `overflow: hidden` could give them, so text was getting silently clipped. `.dish-grid` and `.gallery-grid` now use `repeat(auto-fit, minmax(240px, 1fr))` / `minmax(130px, 1fr)` — tiles hold a safe minimum width and the grid adds more columns (or wraps rows) as space allows, rather than being forced narrower than their content can support. 240px is roughly 55–60% of the prior 3-column width, not an exact half, chosen empirically (tested across viewport widths from 901px to 1920px) as the smallest size with no caption overflow. The mobile carousel's card width was changed from a `78vw` relative value to a fixed `240px` for the same reason and for consistency with the desktop floor. Also added `flex-wrap: wrap` to `.dish-top` (name/price row) — at the smaller card width, a long price like `€PLACEHOLDER` could otherwise overlap the wrapped dish name instead of dropping to its own line.
