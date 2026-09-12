import type { Dues } from '@/types/data';
import type { PaypalTransaction } from '@/types/paypal';

export function classifyDuesFromTransaction(
  txn: PaypalTransaction,
): { monthly?: boolean; supporter?: boolean } {
  const title = txn.itemTitle.toLowerCase();
  const monthly = /\bdues subscription\b/.test(title);
  const supporter = /\bgods\b/.test(title);
  return {
    monthly: monthly || undefined,
    supporter: supporter || undefined,
  };
}

export function reduceTransactionsToLedgerDraft(
  transactions: PaypalTransaction[],
): Dues[] {
  const byName = new Map<string, Dues>();
  for (const txn of transactions) {
    if (!txn.date) continue;
    const { monthly, supporter } = classifyDuesFromTransaction(txn);
    const existing = byName.get(txn.name);
    if (existing && txn.date <= existing.date) continue;
    byName.set(txn.name, { name: txn.name, date: txn.date, monthly, supporter });
  }
  return [...byName.values()].sort(
    (a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name),
  );
}
