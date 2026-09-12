import { describe, it, expect } from 'vitest';
import type { PaypalTransaction } from '@/types/paypal';
import { classifyDuesFromTransaction, reduceTransactionsToLedgerDraft } from '@/utils/dues-ledger';

function txn(partial: Partial<PaypalTransaction>): PaypalTransaction {
  return {
    date: '2026-09-11',
    name: 'Test Payer',
    email: '',
    type: 'Payment',
    status: 'T0000',
    itemTitle: '',
    gross: 0,
    fee: 0,
    net: 0,
    txnId: '',
    ...partial,
  };
}

describe('classifyDuesFromTransaction', () => {
  it('marks GODs subscription charges as monthly supporters', () => {
    expect(classifyDuesFromTransaction(txn({ itemTitle: 'GODs Yearly Dues Subscription' }))).toEqual(
      { monthly: true, supporter: true },
    );
  });

  it('marks player dues subscriptions as monthly only', () => {
    expect(
      classifyDuesFromTransaction(txn({ itemTitle: 'Rocky Gorge Yearly Dues Subscription' })),
    ).toEqual({
      monthly: true,
      supporter: undefined,
    });
  });

  it('leaves one-time purchases unflagged', () => {
    expect(classifyDuesFromTransaction(txn({ itemTitle: 'Fall Dues' }))).toEqual({
      monthly: undefined,
      supporter: undefined,
    });
  });
});

describe('reduceTransactionsToLedgerDraft', () => {
  it('dedupes by name keeping the latest date and emits minimal rows', () => {
    const draft = reduceTransactionsToLedgerDraft([
      txn({
        name: 'Mason McIlwee',
        date: '2026-08-16',
        itemTitle: 'Rocky Gorge Yearly Dues Subscription',
      }),
      txn({
        name: 'Jamel Murray',
        date: '2026-09-11',
        itemTitle: 'Fall Dues',
      }),
      txn({
        name: 'Mason McIlwee',
        date: '2026-09-11',
        itemTitle: 'GODs Yearly Dues Subscription',
      }),
    ]);

    const mason = draft.find((entry) => entry.name === 'Mason McIlwee');
    const jamel = draft.find((entry) => entry.name === 'Jamel Murray');

    expect(draft).toHaveLength(2);
    expect(mason).toEqual({
      name: 'Mason McIlwee',
      date: '2026-09-11',
      monthly: true,
      supporter: true,
    });
    expect(jamel).toEqual({
      name: 'Jamel Murray',
      date: '2026-09-11',
      monthly: undefined,
      supporter: undefined,
    });
  });
});