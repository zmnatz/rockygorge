# ADR: Dues and supporter rolls are maintained by reviewed admin commits

## Status

Accepted

## Context

The club keeps two rolls of people who have paid: the **Dues Record** (`content/admin/dues.yaml`, one entry per member) and the **Supporters List** (the `supporters` name array on the supporters store item in `content/store.yml`). PayPal transactions hold the source evidence for both, but the records themselves live in YAML and are rendered by the build.

We added an admin flow on the dues Item Transactions page (`/admin/transactions/dues`) that proposes new additions: for the selected destination roll, the payers (Status `S` payments only) whose normalized name is not already recorded, each at their most recent payment. The administrator picks the destination roll for the whole batch — the Dues Record or the Supporters List — and the item title is shown per row so they can tell a GODs supporter payment from a player-dues payment. No amount is ever considered; a member is flagged `monthly` when the transaction's item title names the dues subscription, otherwise not, with a per-row override.

## Decision

The two rolls are updated **only through this reviewed, PR-based flow** — never auto-synced from PayPal. The administrator decides, from the evidence, who belongs on which roll, and the commit follows the existing Admin handler convention: write to a new branch, open a pull request, and merge when reviewed. Proposals are conservative: one entry per payer, `S`-status payments only, matched by normalized name so duplicates within a range collapse, and always scoped to the date range the administrator ran.

## Considered options

- **Auto-sync the rolls from PayPal.** Rejected: no review point, wrong data would go straight into a build, and the GODs Tier plan is shared between the dues and supporters items so an automated classifier would misplace supporters on the player roll.
- **Per-row destination.** Rejected in favor of one selector for the whole batch: simpler UI, and the administrator's batch choice plus the visible item titles are enough to keep the rolls clean.

## Consequences

- A payer missed because their latest `S` payment fell outside the chosen range stays off the roll until the range is widened — the diff is range-bound by design.
- The rolls can drift from PayPal (e.g. a chargeback, or a member never committed) until the administrator runs the flow — a deliberate acceptance of staleness for the sake of human review.
- The monthly flag is a heuristic keyed to the subscription plan name in the item title, not to the price; the administrator overrides per row when the heuristic is wrong (e.g. a yearly subscription whose title also names the plan).
