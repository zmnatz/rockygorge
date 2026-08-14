import type { StoreItem } from '../types/data';
import type { PaypalTransaction } from '../types/paypal';

/** The distinct identifiers a Subscription Plan can be recognized by in a
 *  transaction's item title: the plan's `name`, its hosted-button `id`, and
 *  the `value` of each selectable option (the chosen tier). The generic plan
 *  `value` field and the display-only option `label`s are deliberately
 *  excluded — they are too likely to collide with one-time purchase titles
 *  (e.g. a one-time "Fall Dues" payment must not match the supporters page). */
export function subscriptionKeys(item: Pick<StoreItem, 'subscriptions'>): string[] {
  const keys: string[] = [];
  for (const plan of item.subscriptions ?? []) {
    if (plan.name) keys.push(plan.name);
    if (plan.id) keys.push(plan.id);
    for (const option of plan.options ?? []) {
      if (option.value) keys.push(option.value);
    }
  }
  return [...new Set(keys)];
}

/** Whether a Transaction is attributed to a Subscription Plan: the
 *  transaction's item title must contain a plan identifier — its name, its
 *  hosted-button id, or a chosen option value — case-insensitively. */
export function isSubscriptionMatch(
  txn: PaypalTransaction,
  item: Pick<StoreItem, 'subscriptions'>,
): boolean {
  const title = txn.itemTitle.toLowerCase();
  return subscriptionKeys(item).some((key) => title.includes(key.toLowerCase()));
}

/** Whether a Transaction is attributed to a Store Item: the transaction's item
 *  title must contain the item's `description` (case-insensitive), falling
 *  back to its `title` when no description matches; when the item carries
 *  Subscription Plans, a transaction is also attributed when its item title
 *  contains a plan identifier (name, hosted-button id, or chosen option
 *  value). */
export function isItemMatch(
  txn: PaypalTransaction,
  item: Pick<StoreItem, 'title' | 'description' | 'subscriptions'>,
): boolean {
  const title = txn.itemTitle.toLowerCase();
  const description = item.description.toLowerCase();
  if (description && title.includes(description)) return true;
  const itemTitle = item.title.toLowerCase();
  if (itemTitle && title.includes(itemTitle)) return true;
  return isSubscriptionMatch(txn, item);
}
