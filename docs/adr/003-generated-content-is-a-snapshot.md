# ADR: Generated content is a snapshot, not a reference

## Status

Accepted

## Context

The admin needs an assisted-creation flow ("Generate from calendar") that turns a Google Calendar item into either an Event page (`events.yml`) or a Store Item (`store.yml`). The calendar item carries `summary`, `description`, `location`, `start`, and `end`; the target content types carry `title`, `description`, `summary`, `slug`, and (after this feature) `location`, `start`, `end`.

The natural alternatives were:

1. **Snapshot** — copy the calendar item's values into the target's YAML at generation time. No link to the source persists.
2. **Live reference** — store the calendar item's Google ID on the target and resolve date/location at render time by fetching the calendar and looking up that exact item.
3. **Hybrid** — snapshot with a live-reference fallback.

A live reference would have required the event/store pages (statically built today via `getStaticProps`) to fetch the calendar client-side, and would tie site content lifetime to a Google calendar item's lifetime.

## Decision

Generation produces a **snapshot**. The admin picks a calendar item, the target form is pre-filled with the item's values, and saving writes those copied values into the target YAML through the normal admin handler PR flow. No reference to the source calendar item persists.

The fuzzy title-match rendered by `<CalendarEventDetail>` (lowercase substring match of page title against calendar items) remains the render mechanism for dates/location on both event and store pages. The generated snapshot fields live in YAML alongside it; the two may disagree if the calendar item later changes.

## Consequences

- Event and store pages stay fully static; no client-side calendar fetch is required on the generated page.
- Snapshot fields are editable in the admin before save, and remain editable afterwards by hand.
- Dates in YAML are not used for rendering on the page — the fuzzy title-match is. A future reader may find the duplicated values surprising; this is accepted.
- Generation does not deduplicate; the same calendar item can be re-generated into multiple drafts. Hidden-by-default drafts give the admin a chance to review before the content goes live via PR.