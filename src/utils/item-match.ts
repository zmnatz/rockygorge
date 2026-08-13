import type { StoreItem } from '../types/data';
import type { PaypalTransaction } from '../types/paypal';

/** Whether a Transaction is attributed to a Store Item: a transaction is
 *  attributed authoritatively by the item slug embedded in the order at
 *  checkout, falling back to the text match (item title must contain the
 *  item's `description`, then its `title`, case-insensitive) for
 *  transactions that predate the slug. */
export function isItemMatch(txn: PaypalTransaction, item: StoreItem): boolean {
  if (txn.itemSlug && txn.itemSlug === item.slug) return true;
  const title = txn.itemTitle.toLowerCase();
  const description = item.description.toLowerCase();
  if (description && title.includes(description)) return true;
  const itemTitle = item.title.toLowerCase();
  return itemTitle ? title.includes(itemTitle) : false;
}
