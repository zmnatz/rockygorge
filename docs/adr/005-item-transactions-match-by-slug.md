# ADR: Store item transactions are matched by an embedded slug, with description text as fallback

## Status

Accepted

## Context

The admin can query PayPal transactions by date range (`admin-transactions`), and store items live in `content/store.yml`. We wanted, for any store item, a linked admin page that lists that item's purchases over a chosen date range.

The checkout (`PaypalProduct`'s `generateOrderInfo`) sends only `purchase_units[].description` — the store item's `description` field — with no item name or SKU. So a transaction carries no machine-readable store-item key; the flattened `itemTitle` is either PayPal's cart item names or a fallback to the order's subject/note, which for our one-time purchases equals the store item's `description`.

## Decision

A transaction is attributed to a store item (an **Item Match**) authoritatively by the store item's `slug`, which the checkout embeds in the PayPal order as a `[slug]` suffix on the line-item name (and on the order description for orders that send no line item). The flattened transaction carries the parsed key as `itemSlug`. For transactions that predate the change, the text match is the fallback: the transaction's item title must contain the item's `description` (case-insensitive), falling back to the `title`. A transaction may match several items and appears on each matching item's page; a transaction matching no item appears on no item page. The match runs client-side as a pure function over the already-fetched date-range transactions, and the per-item view (`/admin/transactions/[slug]`) is read-only. Payments made through the subscription billing flow carry no `description` and are not attributed — recurring dues and supporter payments are out of scope (future work); one-time purchases on any store item, including dues and supporters, are attributed normally.

Embedding the store item's slug in the PayPal order was initially deferred because it only helps transactions created after the change, leaving existing history unmatched. It is now implemented: the slug is the more robust key (immune to description renames), the text match demotes to a fallback for legacy transactions, and the `[slug]` suffix is stripped from the item title when the transaction is flattened so it never shows in the report.

## Consequences

- Renaming or editing a store item's `description` (or `title`) silently breaks attribution for historical transactions that used the old text.
- Refunds and subscriptions that do not carry the `description` in their item title do not appear on item pages.
- The match rule must stay a pure function (`src/utils/item-match.ts`) so it is unit-testable and shared by any future consumer.
