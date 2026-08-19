import type { Dues } from '../types/data';
import type { PaypalTransaction } from '../types/paypal';

/** PayPal's Transaction Search API marks settled payments with `S`. Pending,
 *  failed, and reversed payments never enter a roll. */
const SUCCESS_STATUS = 'S';

/** The marker carried in a Transaction's item title when the payment is a
 *  monthly dues subscription (rather than a one-time season purchase). The
 *  amount is deliberately not considered. */
const SUBSCRIPTION_MARKER = 'subscription';

/** A proposed new roll entry derived from a PayPal transaction. */
export interface DuesDiffEntry {
  name: string;
  date: string;
  monthly: boolean;
  /** The transaction's item title, shown so the reviewer can tell a GODs
   *  supporter payment from a player-dues payment. */
  itemTitle: string;
  /** The transaction's gross amount, for reference only. */
  amount: number;
  txnId: string;
}

/** Normalize a payer/member name for comparison: trimmed, whitespace
 *  collapsed, lowercased. */
export function normalizeDuesName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Whether a transaction is a Monthly Dues subscription payment — its item
 *  title names the dues subscription, not a one-time purchase. */
export function isMonthlyDuesPayment(txn: PaypalTransaction): boolean {
  return txn.itemTitle.toLowerCase().includes(SUBSCRIPTION_MARKER);
}

/** The most recent settled (`S`) payment per payer, skipping refunds and
 *  withdrawals. */
function latestSettledPayments(
  transactions: PaypalTransaction[],
): Map<string, PaypalTransaction> {
  const latestByPayer = new Map<string, PaypalTransaction>();
  for (const txn of transactions) {
    if (txn.type !== 'Payment' || txn.status !== SUCCESS_STATUS) continue;
    const key = normalizeDuesName(txn.name);
    if (!key) continue;
    const current = latestByPayer.get(key);
    if (!current || txn.date > current.date) latestByPayer.set(key, txn);
  }
  return latestByPayer;
}

function toEntry(txn: PaypalTransaction, monthly: boolean): DuesDiffEntry {
  return {
    name: txn.name,
    date: txn.date,
    monthly,
    itemTitle: txn.itemTitle,
    amount: txn.gross,
    txnId: txn.txnId,
  };
}

/** Diff the dues-attributed transactions against the Dues Record: returns one
 *  proposed entry per payer (most recent settled payment) whose normalized
 *  name is not already in the record. */
export function computeDuesDiff(
  transactions: PaypalTransaction[],
  existing: Dues[],
): DuesDiffEntry[] {
  const existingNames = new Set(existing.map((entry) => normalizeDuesName(entry.name)));
  return [...latestSettledPayments(transactions).entries()]
    .filter(([key]) => !existingNames.has(key))
    .map(([, txn]) => toEntry(txn, isMonthlyDuesPayment(txn)))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Diff the dues-attributed transactions against the Supporters List: returns
 *  one proposed entry per payer (most recent settled payment) whose
 *  normalized name is not already a Supporter. */
export function computeSupporterDiff(
  transactions: PaypalTransaction[],
  existing: string[],
): DuesDiffEntry[] {
  const existingNames = new Set(existing.map(normalizeDuesName));
  return [...latestSettledPayments(transactions).entries()]
    .filter(([key]) => !existingNames.has(key))
    .map(([, txn]) => toEntry(txn, false))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Merge incoming entries into the existing Dues Record, deduplicating by
 *  normalized name (the most recent date wins) and sorting newest-first.
 *  Entries keep the record's canonical shape: `monthly` is only present when
 *  true. */
export function mergeDues(existing: Dues[], incoming: Dues[]): Dues[] {
  const byName = new Map<string, Dues>();
  for (const entry of existing) {
    const key = normalizeDuesName(entry.name);
    if (key && !byName.has(key)) byName.set(key, entry);
  }
  for (const entry of incoming) {
    const key = normalizeDuesName(entry.name);
    if (!key) continue;
    const current = byName.get(key);
    if (!current) {
      byName.set(key, {
        name: entry.name.trim().replace(/\s+/g, ' '),
        date: entry.date,
        monthly: entry.monthly,
      });
    } else if (entry.date > current.date) {
      byName.set(key, { ...current, date: entry.date, monthly: entry.monthly });
    }
  }
  return [...byName.values()]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(({ name, date, monthly }) => (monthly ? { name, date, monthly: true } : { name, date }));
}

/** Append incoming names to the existing Supporters List, deduplicating by
 *  normalized name and keeping each name's original casing. */
export function mergeSupporters(existing: string[], incoming: string[]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const name of [...existing, ...incoming]) {
    const key = normalizeDuesName(name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(name.trim().replace(/\s+/g, ' '));
  }
  return merged;
}
