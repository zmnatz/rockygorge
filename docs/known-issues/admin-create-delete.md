# Admin create/delete — known issues and knowledge gaps

Implements issue #78: create + delete items on the five content admin pages
(store, events, links, forms, calendar). The link_mappings page stays
edit-only.

This doc records the deliberate deviations and open questions that came up
during implementation, so a future editor knows the intent behind them.

## Deviations from the letter of the issue

### 1. Calendar filters do not default `limit` to 0

The issue says new items pre-fill "zero numbers". For calendar filters that
would write `limit: 0`, and the CI data check
(`calendar-data.test.ts` — "limit is a positive number when present") fails on
`0`. Instead:

- `createDefaultItem` omits **number** fields unless the page supplies an
  explicit `createDefaults` value.
- Every number field that needs a default is declared per page in
  `config/admin.yml`:
  - store → `createDefaults.defaultAmount: 0`
  - forms → `createDefaults.width: 640`, `height: 1000`
  - calendar → no number defaults, so a new filter has no `limit` at all and
    passes CI.

This is the only number-field policy that makes "new item with only its id"
pass the CI data-shape checks on every creatable page.

### 2. The id field is now editable on store / events / links / forms

Previously `slug` was not in those pages' `fields` lists, so the editor could
not change an item's id. Create (and the requirement to block *renaming* into a
collision) makes the id editable, so a `slug` text field was added to each of
the four pages' `fields` lists. Existing items are unaffected — the slug
renders with its current value, and editing it is now allowed (guarded against
blank/duplicate ids). Calendar already had `name` in its fields; link_mappings
already had `type`.

### 3. Delete and create are gated by one flag

`creatable: false` on link_mappings removes both the Add button and the row
delete action. The component treats "not creatable" as "edit-only". If a page
ever needs create-without-delete, this should be split into two flags.

## Open questions / gaps

- **No server-side or CI-side validation of new items.** Id uniqueness is
  enforced only in the client dialog (`validateItemId`). A malformed item can
  still be saved via the editor (e.g. an invalid `matches` regex on a calendar
  filter, or a `limit: 0` typed by hand) and would surface as a failing CI
  check on the generated PR. The issue explicitly scoped this to client-side,
  so this is accepted.
- **Delete is immediate with no confirmation.** Accidental deletes are
  reversible only by not pressing "Save All Changes" — once saved, the item is
  gone on the PR branch (still reviewable, but the PR flow is the only safety
  net).
- **`defaultAmount` of 0 on a new store item.** A brand-new store item with
  `defaultAmount: 0` passes the data-shape check but may not behave sensibly
  on the public checkout until an editor sets a real amount. This matches the
  issue's explicit default.
- **Forms default height (1000).** The issue specifies `height: 1000`, even
  though every existing form's height differs (520–3046). A new form with only
  its slug will render a 1000px-tall embed; the editor is expected to correct
  it before making the item public.
