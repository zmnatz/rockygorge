# Domain Glossary: Rocky Gorge

## Content

**Content** refers to YAML data files that define what users see on the site — event listings, calendar configuration, store items, form embeds, navigation links, gauntlet leaderboards, and stats. These live in `content/` at the repo root and are imported via the `@content/*` alias.

Files: `calendar.yml`, `events.yml`, `store.yml`, `forms.yml`, `links.yml`, `gauntlet/`, `stats/`

## Config

**Config** refers to YAML data files that drive application behavior — admin page definitions, link text mappings, and other settings that control how the app processes data rather than what it displays. These live in `config/` at the repo root and are imported via the `@config/*` alias.

Files: `admin.yml`, `link_mappings.yml`

## Events

**Calendar Item**:
A single entry in the team's Google Calendar — `summary`, `location`, `htmlLink`, `start`, `end`. Displayed on the calendar surface and filtered into categories (Training, Events, Board Meetings) by regex in `calendar.yml`. A calendar item is the *source* for generating an event, never linked to one after generation.
_Avoid_: Event (when referring to a calendar entry)

**Event**:
A site landing page stored in `events.yml` — `slug`, `title`, `description`, `summary`, `details`, `hide`, `organizers`. Rendered at `/events/[slug]`. An event carries its own date, location, and time as copied `location`/`start`/`end` snapshot values; it does not reference a calendar item.
_Avoid_: Calendar entry, schedule appointment

**Generate from calendar**:
The assisted-creation flow in the admin: the admin picks any upcoming calendar item (the source item), and the target-page form is pre-filled by copying the item's values into a new draft. The values are snapshotted — no reference to the source item persists. The calendar item's `summary` becomes the target's `title`; Google's `description` is carried over into the target's `description`; `location`, `start`, and `end` map to their namesake target fields. The target's own `summary` (teaser) field and any other non-derivable fields start blank for the human to fill. The target is either an Event (on the Events Admin page) or a Store Item (on the Store Admin page); the same widget lives on both pages and infers the target from the page. The draft starts hidden; the admin reviews and edits, then saving runs through the admin handler PR flow.
_Avoid_: Import, sync, associate

**Generated event draft**:
The intermediate record produced when generating. The slug is auto-derived from the title via the `slugify` utility but remains editable; no duplicate detection is performed; all-day or untimed calendar items are accepted and their date text is carried into the snapshot. Payment-oriented store fields (`defaultAmount`, `options`, `subscriptions`, `supporters`) are not generated — they start empty for the human to fill.
_Avoid_: Imported event, synced event

**Store Item**:
A purchasable item stored in `store.yml` — `slug`, `title`, `description`, `summary`, `hide`, `defaultAmount`, `options`, `details`, `subscriptions`, `supporters`. Rendered at `/[slug]`. Because store items are often tied to an occasion (banquet, open, camp), a store item can be generated from a calendar item the same way an event can, copying `location`/`start`/`end` snapshot values. Like events, store items render their date and location through the fuzzy calendar title-match, not from the snapshot.
_Avoid_: Product, purchase option

**Fuzzy title-match**:
The lookup used by `<CalendarEventDetail>` to render a date/time/location block on a page: it lowercases and substring-matches the page title against every upcoming calendar item. Used on event pages and store pages. Generation does not replace this — pages keep rendering through the match, and the snapshot sits alongside it as data.
_Avoid_: Precise lookup, calendar association

## Admin

**Admin handler**:
The Netlify function that persists admin edits by writing the updated YAML to a new GitHub branch and opening a pull request. Saving an event from the admin does not publish directly; it goes through the PR flow.
_Avoid_: Save endpoint

**Admin Console**:
The `/admin` route group where Content and Config are managed. Signing in is required to use it.
_Avoid_: admin pages, admin section, CMS

**Administrator**:
A person signed in to the Admin Console.
_Avoid_: admin, user
