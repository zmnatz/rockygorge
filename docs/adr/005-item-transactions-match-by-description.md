# ADR: Store item transactions are matched by description text

## Status

Accepted

## Context

The admin can query PayPal transactions by date range (`admin-transactions`), and store items live in `content/store.yml`. We wanted, for any store item, a linked admin page that lists that item's purchases over a chosen date range.

The checkout (`PaypalProduct`'s `generateOrderInfo`) sends only `purchase_units[].description` — the store item's `description` field — with no item name or SKU. So a transaction carries no machine-readable store-item key; the flattened `itemTitle` is either PayPal's cart item names or a fallback to the order's subject/note, which for our one-time purchases equals the store item's `description`.

## Decision

A transaction is attributed to a store item (an **Item Match**) by text: the transaction's item title must contain the item's `description` (case-insensitive), falling back to the `title` if no description matches. A transaction may match several items and appears on each matching item's page; a transaction matching no item appears on no item page. The match runs client-side as a pure function over the already-fetched date-range transactions, and the per-item view (`/admin/transactions/[slug]`) is read-only. One-time purchases on any store item, including dues and supporters, are attributed normally.

When a store item carries Subscription Plans (dues and supporters), a transaction is also attributed when its item title contains a plan identifier — the plan `name`, its hosted-button `id`, a chosen option `value`, or an explicit plan `keyword` — case-insensitively. The subscription billing flow sends no store item `description`; the recurring payments instead surface their tier through PayPal's `item_options` (and the plan/subject text), which `flattenTransaction` joins into the item title so the rule can match it. Plan `keyword`s carry the strings PayPal reports on each payment that the plan metadata doesn't already capture (e.g. "Dues Subscription" in "Rocky Gorge Yearly Dues Subscription"). The generic plan `value` field and the display-only option `label`s are deliberately excluded as keys because they collide with one-time purchase titles (a one-time "Fall Dues" payment must not match the supporters page).

Embedding the store item's slug in the PayPal order at checkout was considered and rejected for now: it is the more robust key but only helps transactions created after the change, leaving existing history unmatched. It remains planned future work; when it lands it becomes the authoritative key and the text match demotes to a fallback for legacy transactions.

## Consequences

- Renaming or editing a store item's `description` (or `title`) silently breaks attribution for historical transactions that used the old text.
- Refunds do not appear on item pages unless they carry the matching text.
- A subscription payment is attributed only when its item title carries a plan identifier; a recurring charge whose title is empty or unrecognized still appears on no item page.
- The match rule must stay a pure function (`src/utils/item-match.ts`) so it is unit-testable and shared by any future consumer.
