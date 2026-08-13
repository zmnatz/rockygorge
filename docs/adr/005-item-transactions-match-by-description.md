# ADR: Store item transactions are matched by description text

## Status

Accepted

## Context

The admin can query PayPal transactions by date range (`admin-transactions`), and store items live in `content/store.yml`. We wanted, for any store item, a linked admin page that lists that item's purchases over a chosen date range.

The checkout (`PaypalProduct`'s `generateOrderInfo`) sends only `purchase_units[].description` — the store item's `description` field — with no item name or SKU. So a transaction carries no machine-readable store-item key; the flattened `itemTitle` is either PayPal's cart item names or a fallback to the order's subject/note, which for our one-time purchases equals the store item's `description`.

## Decision

A transaction is attributed to a store item (an **Item Match**) by text: the transaction's item title must contain the item's `description` (case-insensitive), falling back to the `title` if no description matches. Ties resolve to the longer match; unmatched transactions appear on no item page. The match runs client-side as a pure function over the already-fetched date-range transactions, and the per-item view (`/admin/transactions/[slug]`) is read-only. Subscription items (dues, supporters) are excluded for now — their payments arrive via the subscription billing flow and carry no `description`, so they render no rows.

Embedding the store item's slug in the PayPal order at checkout was considered and rejected for now: it is the more robust key but only helps transactions created after the change, leaving existing history unmatched. It remains planned future work; when it lands it becomes the authoritative key and the text match demotes to a fallback for legacy transactions.

## Consequences

- Renaming or editing a store item's `description` (or `title`) silently breaks attribution for historical transactions that used the old text.
- Refunds and subscriptions that do not carry the `description` in their item title do not appear on item pages.
- The match rule must stay a pure function (`src/utils/item-match.ts`) so it is unit-testable and shared by any future consumer.
