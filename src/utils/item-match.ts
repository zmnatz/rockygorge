import type { Product } from '../types/data';
import type { PaypalTransaction } from '../types/paypal';

/** The Store Item fields the Item Match rule and the per-item report read. */
export type StoreItem = Pick<Product, 'slug' | 'title' | 'description'>;

/** Whether a Transaction is attributed to a Store Item: the transaction's item
 *  title must contain the item's `description` (case-insensitive), falling
 *  back to its `title` when no description matches. */
export function isItemMatch(txn: PaypalTransaction, item: Pick<StoreItem, 'title' | 'description'>): boolean {
  const title = txn.itemTitle.toLowerCase();
  const description = item.description.toLowerCase();
  if (description && title.includes(description)) return true;
  const itemTitle = item.title.toLowerCase();
  return itemTitle ? title.includes(itemTitle) : false;
}
