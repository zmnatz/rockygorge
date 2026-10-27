# ADR: Store item transactions are matched by an embedded slug, with text as fallback

## Status

Accepted

## Context

The admin can query PayPal transactions by date range (`admin-transactions`), and store items live in `content/store.yml`. We wanted, for any store item, a linked admin page that lists that item's purchases over a chosen date range.

The checkout (`PaypalProduct`'s `generateOrderInfo`) originally sent only `purchase_units[].description` — the store item's `description` field — with no item name or SKU. So a transaction carried no machine-readable store-item key, and attribution fell back to matching the flattened `itemTitle` against the item's text.

## Decision

A transaction is attributed to a store item (an **Item Match**) authoritatively by the store item's `slug`, which the checkout embeds in the PayPal order as a ` [item:slug]` suffix on the line-item name (and on the order description, which covers orders that send no line item). `flattenTransaction` parses the suffix into the transaction's `itemSlug` and strips it from the displayed `itemTitle`. A transaction carrying an `itemSlug` is attributed by that slug alone.

For transactions that predate the change (no `itemSlug`), the text match is the fallback: the transaction's item title must contain the item's `description` (case-insensitive), falling back to the `title` if no description matches. When a store item carries Subscription Plans (dues and supporters), a transaction is also attributed when its item title contains a plan identifier — the plan `name`, its hosted-button `id`, a chosen option `value`, or an explicit plan `keyword` — case-insensitively. The subscription billing flow sends no store item `description`; the recurring payments instead surface their tier through PayPal's `item_options` (and the plan/subject text), which `flattenTransaction` joins into the item title so the rule can match it. Plan `keyword`s carry the strings PayPal reports on each payment that the plan metadata doesn't already capture (e.g. "Dues Subscription" in "Rocky Gorge Yearly Dues Subscription"). The generic plan `value` field and the display-only option `label`s are deliberately excluded as keys because they collide with one-time purchase titles (a one-time "Fall Dues" payment must not match the supporters page).

A transaction may match several items and appears on each matching item's page; a transaction matching no item appears on no item page. The match runs client-side as a pure function (`itemMatcher` in `src/utils/item-match.ts`) over the already-fetched date-range transactions, and the per-item view (`/admin/transactions/[slug]`) is read-only.

## Consequences

- New one-time purchases are attributed by slug, so renaming or editing a store item's `description` or `title` no longer breaks attribution for them.
- Historical transactions still rely on the text match, so renaming an item's `description` (or `title`) silently breaks attribution for those.
- The `[item:slug]` tag is written and parsed only in `src/utils/item-slug-tag.ts`, so the two sides cannot drift apart.
- The `item:` prefix means ordinary bracketed title text such as `[2-day]` is never read as a slug.
- Refunds do not appear on item pages unless they carry the matching slug or text.
- A subscription payment is attributed only when its item title carries a plan identifier; a recurring charge whose title is empty or unrecognized still appears on no item page.
- The match rule must stay a pure function (`src/utils/item-match.ts`) so it is unit-testable and shared by any future consumer.
