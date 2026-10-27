import type { StoreItem } from '../types/data';
import type { PaypalTransaction } from '../types/paypal';

/** The lowercased identifiers a Store Item is recognized by in a transaction's
 *  item title: its `description` and `title`, and — when it carries
 *  Subscription Plans — each plan's `name`, its hosted-button `id`, the
 *  `value` of each selectable option (the chosen tier), and any explicit
 *  plan `keywords`. The generic plan `value` field and the display-only option
 *  `label`s are deliberately excluded — they are too likely to collide with
 *  one-time purchase titles (e.g. a one-time "Fall Dues" payment must not
 *  match the supporters page). */
interface MatchKeys {
  description: string;
  title: string;
  subscription: string[];
}

function matchKeys(item: Pick<StoreItem, 'title' | 'description' | 'subscriptions'>): MatchKeys {
  const description = item.description.toLowerCase();
  const title = item.title.toLowerCase();
  const subscription = new Set<string>();
  for (const plan of item.subscriptions ?? []) {
    if (plan.name) subscription.add(plan.name.toLowerCase());
    if (plan.id) subscription.add(plan.id.toLowerCase());
    for (const option of plan.options ?? []) {
      if (option.value) subscription.add(option.value.toLowerCase());
    }
    for (const keyword of plan.keywords ?? []) {
      if (keyword) subscription.add(keyword.toLowerCase());
    }
  }
  return { description, title, subscription: [...subscription] };
}

/** Slug attribution is authoritative: a transaction carrying an `itemSlug`
 *  (embedded at checkout, see ADR 009) is attributed by that slug alone.
 *  Returns null when the transaction carries no slug, so the caller falls
 *  back to text matching. */
export function matchBySlug(txn: Pick<PaypalTransaction, 'itemSlug'>, slug: string): boolean | null {
  if (!txn.itemSlug) return null;
  return txn.itemSlug === slug;
}

/** Build a predicate that attributes Transactions to a Store Item. A
 *  transaction carrying an `itemSlug` is attributed by that slug alone. Otherwise the transaction's item title must
 *  contain the item's `description` (case-insensitive), falling back to its
 *  `title` when no description matches; when the item carries Subscription
 *  Plans, it also matches when its item title contains a plan identifier
 *  (name, hosted-button id, chosen option value, or explicit keyword). The
 *  item's keys are prepared once, so the predicate is safe to reuse across
 *  many transactions. */
export function itemMatcher(
  item: Pick<StoreItem, 'slug' | 'title' | 'description' | 'subscriptions'>,
): (txn: PaypalTransaction) => boolean {
  const keys = matchKeys(item);
  return (txn) => {
    const bySlug = matchBySlug(txn, item.slug);
    if (bySlug !== null) return bySlug;
    const title = txn.itemTitle.toLowerCase();
    if (keys.description && title.includes(keys.description)) return true;
    if (keys.title && title.includes(keys.title)) return true;
    return keys.subscription.some((key) => title.includes(key));
  };
}
