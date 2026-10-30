# How to add an event

This page is for adding or changing an event on the website — no coding knowledge needed, just a web browser and a (free) GitHub account that already has access to this repository. Everything happens on github.com; you never need to install anything.

The website's events all live in one file: **`data/events.json`**. The site reads that file and automatically builds the Events section, in both English and Finnish, for you. You never need to touch any other file to add, change, or remove an event.

## Before you start: what the file looks like

`data/events.json` is a list of events. Each event is one block between `{` and `}`, and the blocks are separated by commas. It looks like this (the real file currently has two events in it — a weekly one and a one-time one):

```json
[
  {
    "id": "karaoke-friday",
    "type": "recurring",
    "weekday": 5,
    "startTime": "21:00",
    "endTime": "01:30",
    "title": { "en": "Karaoke night", "fi": "Karaokeilta" },
    "description": {
      "en": "Grab the mic. Every Friday night, free entry.",
      "fi": "Ota mikki käteen. Joka perjantai-ilta, vapaa pääsy."
    },
    "tag": { "en": "Every Friday", "fi": "Joka perjantai" },
    "price": { "en": "Free entry", "fi": "Vapaa pääsy" }
  }
]
```

A few things about the format (called **JSON**) that are easy to get wrong:

- Every piece of text goes in **double quotes** (`"like this"`), never single quotes.
- Every line except the last one inside a `{ ... }` block needs a **comma** at the end.
- The **last** item inside a `{ ... }` or `[ ... ]` block must **not** have a trailing comma.
- Every `{` needs a matching `}`, and every `[` needs a matching `]`.

If any of these is wrong, the website's "build" step will fail and the site won't update until it's fixed — see "If something goes wrong" at the bottom. It's very hard to break the *live* site this way (the old, working version stays up until a fixed file is saved), so don't worry about experimenting.

## Editing the file on github.com

1. Go to the file: **`data/events.json`** in this repository on github.com.
2. Click the **pencil icon** (✏️, "Edit this file") near the top right of the file view.
3. Make your change (see the two examples below).
4. Scroll down to **"Commit changes"**, add a short description of what you changed (e.g. "Add Christmas Eve event"), and click **"Commit changes directly to the main branch."**
5. That's it. Within a couple of minutes, an automated step rebuilds the site and your event appears — you don't need to do anything else. (It also runs once every night on its own, which is what makes a past one-off event disappear on its own — see "One-off events clean themselves up" below.)

## Example 1: adding a recurring (weekly) event

Recurring events repeat every week on the same weekday. Add a new block like this one **inside the square brackets `[ ]`**, remembering to add a comma after the *previous* event's closing `}` if yours isn't the first one in the list:

```json
  {
    "id": "taco-tuesday",
    "type": "recurring",
    "weekday": 2,
    "startTime": "17:00",
    "endTime": "22:00",
    "title": { "en": "Taco Tuesday", "fi": "Taco-tiistai" },
    "description": {
      "en": "Half-price tacos, every Tuesday evening.",
      "fi": "Puoleen hintaan tacot joka tiistai-ilta."
    },
    "tag": { "en": "Every Tuesday", "fi": "Joka tiistai" },
    "price": { "en": "Tacos from €3", "fi": "Tacot alk. 3€" }
  }
```

`weekday` is a number: **1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday, 7 = Sunday.**

## Example 2: adding a one-off (single date) event

One-off events happen once, on a specific calendar date, and automatically stop showing once that date has passed — you never need to come back and delete it.

```json
  {
    "id": "new-years-eve-2026",
    "type": "oneoff",
    "date": "2026-12-31",
    "startTime": "20:00",
    "title": { "en": "New Year's Eve party", "fi": "Uudenvuoden juhlat" },
    "description": {
      "en": "Ring in the new year with us — live music from 10pm.",
      "fi": "Vietä uudenvuoden aatto kanssamme — livemusiikkia klo 22 alkaen."
    },
    "tag": { "en": "New Year's Eve", "fi": "Uudenvuoden aatto" }
  }
```

Notice this example has **no `price`** — that's fine. Only include `price` if the event actually has a known price or a "free entry" type of note. Don't guess or invent one.

## What each field means

| Field | Required? | What it is |
|---|---|---|
| `id` | Yes | A short, unique label with no spaces (use `-` instead), e.g. `"christmas-eve-2026"`. Only used internally — never shown on the site. Must be different from every other event's `id`. |
| `type` | Yes | Either `"recurring"` (repeats weekly) or `"oneoff"` (happens once). |
| `weekday` | Only for `recurring` | A number 1–7, Monday=1 through Sunday=7. |
| `date` | Only for `oneoff` | The date, written exactly as `"YYYY-MM-DD"`, e.g. `"2026-12-25"`. |
| `startTime` | No | 24-hour time, e.g. `"21:00"` for 9pm. Leave it out entirely if there's no fixed start time. |
| `endTime` | No | 24-hour time. If the event ends after midnight (e.g. starts 21:00, ends 1:30am), just write the early-morning time, e.g. `"01:30"` — the site understands that this means "the next morning" automatically. |
| `title` | Yes | `{ "en": "...", "fi": "..." }` — the event's name in both languages. |
| `description` | Yes | `{ "en": "...", "fi": "..." }` — one or two sentences about the event, in both languages. |
| `tag` | Yes | `{ "en": "...", "fi": "..." }` — a short label shown on the card, e.g. `"Every Friday"` or `"Halloween"`. |
| `price` | No | `{ "en": "...", "fi": "..." }` — only include this if there's a real price or entry note to show (e.g. `"Free entry"`, `"€10 cover"`). Leave the whole field out if there isn't one — don't write `"TBD"` or guess a number. |
| `image` | No | A filename, e.g. `"karaoke.jpg"`. The actual photo needs to be uploaded to the `images/events/` folder (same "Add file → Upload files" steps as a gallery photo — see the main `README.md`'s "Adding gallery photos") with that exact filename. Leave this field out entirely if you don't have a photo yet. |

## A few important behaviors

- **The soonest event is always shown bigger, with an "Up next" label.** You don't control this — it's calculated automatically from the current date/time, in Finland's own timezone.
- **A "Tonight" / "Tänään illalla" badge appears automatically** on whichever event is happening today (or still going, for a late-running one past midnight).
- **One-off events clean themselves up.** Once a one-off event's date is in the past, it simply stops appearing — including from search engines' listings — without you needing to delete it. This happens automatically once a day, so it may take up to a day after the event ends to fully disappear everywhere; you're welcome to delete the old block yourself at any time too, once you're sure the event is over.
- **If `data/events.json` ever has zero events in it** (just `[]`), the whole Events section — and its menu link — disappears from the site rather than showing an empty box. You don't need to do anything special to "turn it off"; just remove every event, or let them all expire.
- **Prices aren't used for anything except display.** If an event's price text contains the word "free" (in English — e.g. `"Free entry"`), search engines are told it's a free event. Anything else just displays as text and isn't understood as a specific amount by search engines.

## Checklist before you commit

- [ ] Every piece of text is in double quotes (`"like this"`)
- [ ] There's a comma after every line inside a block *except the last one*
- [ ] The new event has its own unique `id`
- [ ] `type` is exactly `"recurring"` or `"oneoff"` (lowercase, with the quotes)
- [ ] A `recurring` event has `weekday` (1–7); a `oneoff` event has `date` (`"YYYY-MM-DD"`)
- [ ] `title`, `description`, and `tag` each have both an `"en"` and an `"fi"` version
- [ ] You didn't invent a `price` or a time that wasn't actually confirmed
- [ ] If you added `image`, the matching photo file is uploaded to `images/events/` with the exact same filename

## If something goes wrong

If you accidentally save broken JSON (a missing comma, a missing quote, etc.), the automated rebuild step will fail and the site will simply **not update** — it keeps showing the last working version, so nothing breaks for visitors. You'll be able to tell something's wrong if your change doesn't appear on the site after a few minutes.

To fix it: open `data/events.json` again, look for the spot you last edited, and check carefully for a missing comma, a missing quote, or a `{`/`}`/`[`/`]` that doesn't have its matching partner. If you're stuck, you can always undo your change (GitHub keeps every previous version of the file) and try again.
