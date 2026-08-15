import { describe, it, expect } from 'vitest';
import { load, dump } from 'js-yaml';
import {
  computeDuesDiff,
  computeSupporterDiff,
  mergeDues,
  mergeSupporters,
  normalizeDuesName,
} from '@/utils/dues-diff';
import type { Dues } from '@/types/data';
import type { PaypalTransaction } from '@/types/paypal';

function payment(
  name: string,
  date: string,
  gross = 220,
  type: PaypalTransaction['type'] = 'Payment',
  status = 'S',
  itemTitle = 'Fall Dues',
): PaypalTransaction {
  return {
    date,
    name,
    email: 'payer@example.com',
    type,
    status,
    itemTitle,
    gross,
    fee: -gross * 0.03,
    net: gross * 0.97,
    txnId: `TXN-${name}-${date}`,
  };
}

describe('normalizeDuesName', () => {
  it('trims, collapses whitespace, and lowercases', () => {
    expect(normalizeDuesName('  John   Smith ')).toBe('john smith');
    expect(normalizeDuesName('JOHN SMITH')).toBe('john smith');
  });
});

describe('computeDuesDiff', () => {
  const existing: Dues[] = [
    { name: 'Jane Doe', date: '2026-08-01' },
    { name: 'John Smith', monthly: true, date: '2026-08-02' },
  ];

  it('returns an empty diff when every payer is already in the record', () => {
    expect(computeDuesDiff([payment('Jane Doe', '2026-08-03')], existing)).toEqual([]);
  });

  it('returns new payers not present in the record', () => {
    const diff = computeDuesDiff([payment('New Player', '2026-08-10')], existing);
    expect(diff).toHaveLength(1);
    expect(diff[0]).toMatchObject({
      name: 'New Player',
      date: '2026-08-10',
      monthly: false,
      itemTitle: 'Fall Dues',
    });
  });

  it('matches existing names case-insensitively and ignoring whitespace', () => {
    const diff = computeDuesDiff([payment('JANE  DOE', '2026-08-03')], existing);
    expect(diff).toEqual([]);
  });

  it('collapses multiple payments per payer to the most recent date', () => {
    const diff = computeDuesDiff(
      [
        payment('New Player', '2026-08-05'),
        payment('New Player', '2026-08-10'),
      ],
      existing,
    );
    expect(diff).toHaveLength(1);
    expect(diff[0].date).toBe('2026-08-10');
  });

  it('ignores refunds and withdrawals', () => {
    const diff = computeDuesDiff(
      [
        payment('Refunded', '2026-08-05', 220, 'Refund'),
        payment('Withdrew', '2026-08-05', 220, 'Withdrawal'),
      ],
      existing,
    );
    expect(diff).toEqual([]);
  });

  it('ignores payments that have not settled', () => {
    const diff = computeDuesDiff(
      [
        payment('Pending', '2026-08-05', 220, 'Payment', 'P'),
        payment('Failed', '2026-08-05', 220, 'Payment', 'F'),
        payment('Reversed', '2026-08-05', 220, 'Payment', 'V'),
      ],
      existing,
    );
    expect(diff).toEqual([]);
  });

  it('marks a subscription payment as monthly from its item title', () => {
    const diff = computeDuesDiff(
      [
        payment('Monthly Guy', '2026-08-11', 35, 'Payment', 'S', 'Rocky Gorge Monthly Dues Subscription'),
      ],
      existing,
    );
    expect(diff[0]).toMatchObject({ name: 'Monthly Guy', monthly: true });
  });

  it('does not use the amount to decide monthly', () => {
    const diff = computeDuesDiff(
      [
        payment('Yearly Sub', '2026-08-11', 400, 'Payment', 'S', 'Rocky Gorge Yearly Dues Subscription'),
      ],
      existing,
    );
    expect(diff[0].monthly).toBe(true);
  });

  it('leaves one-time dues payments non-monthly', () => {
    const diff = computeDuesDiff([payment('Once Guy', '2026-08-11', 220)], existing);
    expect(diff[0].monthly).toBe(false);
  });

  it('sorts new entries newest-first', () => {
    const diff = computeDuesDiff(
      [payment('Older', '2026-08-01'), payment('Newer', '2026-08-12')],
      existing,
    );
    expect(diff.map((entry) => entry.date)).toEqual(['2026-08-12', '2026-08-01']);
  });
});

describe('computeSupporterDiff', () => {
  const existing = ['Chuck Moore', 'Tom Henry', 'Matt Carroll'];

  it('returns payers not already on the supporters list', () => {
    const diff = computeSupporterDiff(
      [payment('GODs Guy', '2026-08-10', 20, 'Payment', 'S', 'DUES: GODs')],
      existing,
    );
    expect(diff).toHaveLength(1);
    expect(diff[0]).toMatchObject({ name: 'GODs Guy', date: '2026-08-10' });
  });

  it('excludes names already on the list, case-insensitively', () => {
    const diff = computeSupporterDiff(
      [payment('chuck  moore', '2026-08-10', 20, 'Payment', 'S', 'DUES: GODs')],
      existing,
    );
    expect(diff).toEqual([]);
  });

  it('never proposes an entry as monthly', () => {
    const diff = computeSupporterDiff(
      [payment('GODs Guy', '2026-08-10', 20, 'Payment', 'S', 'DUES: GODs')],
      existing,
    );
    expect(diff[0].monthly).toBe(false);
  });
});

describe('mergeDues', () => {
  it('appends new entries to the existing record', () => {
    const existing: Dues[] = [{ name: 'Jane Doe', date: '2026-08-01' }];
    const merged = mergeDues(existing, [{ name: 'New Player', date: '2026-08-10' }]);
    expect(merged).toEqual([
      { name: 'New Player', date: '2026-08-10' },
      { name: 'Jane Doe', date: '2026-08-01' },
    ]);
  });

  it('deduplicates by name, keeping the most recent date', () => {
    const existing: Dues[] = [{ name: 'Jane Doe', date: '2026-08-01' }];
    const merged = mergeDues(existing, [{ name: 'JANE DOE', date: '2026-08-05' }]);
    expect(merged).toEqual([{ name: 'Jane Doe', date: '2026-08-05' }]);
  });

  it('keeps the monthly flag from the winning entry', () => {
    const merged = mergeDues([], [{ name: 'Monthly Guy', monthly: true, date: '2026-08-01' }]);
    expect(merged).toEqual([{ name: 'Monthly Guy', monthly: true, date: '2026-08-01' }]);
  });

  it('omits monthly when false so the YAML stays canonical', () => {
    const merged = mergeDues([], [{ name: 'Once Guy', monthly: false, date: '2026-08-01' }]);
    expect(merged).toEqual([{ name: 'Once Guy', date: '2026-08-01' }]);
  });

  it('round-trips through js-yaml without introducing monthly: false', () => {
    const merged = mergeDues(
      [{ name: 'Jane Doe', date: '2026-08-01' }],
      [
        { name: 'Once Guy', date: '2026-08-10' },
        { name: 'Monthly Guy', monthly: true, date: '2026-08-11' },
      ],
    );
    const yaml = dump(merged);
    const loaded = load(yaml) as Dues[];
    expect(loaded).toEqual([
      { name: 'Monthly Guy', monthly: true, date: '2026-08-11' },
      { name: 'Once Guy', date: '2026-08-10' },
      { name: 'Jane Doe', date: '2026-08-01' },
    ]);
    expect(yaml).not.toContain('monthly: false');
  });
});

describe('mergeSupporters', () => {
  it('appends new names and keeps existing order', () => {
    const merged = mergeSupporters(['Chuck Moore', 'Tom Henry'], ['New Supporter']);
    expect(merged).toEqual(['Chuck Moore', 'Tom Henry', 'New Supporter']);
  });

  it('deduplicates by normalized name, keeping the original casing', () => {
    const merged = mergeSupporters(['Chuck Moore'], ['CHUCK  MOORE']);
    expect(merged).toEqual(['Chuck Moore']);
  });

  it('deduplicates within the incoming batch', () => {
    const merged = mergeSupporters([], ['Alice Smith', 'alice smith']);
    expect(merged).toEqual(['Alice Smith']);
  });

  it('skips blank names', () => {
    const merged = mergeSupporters([], ['  ', 'Bob Jones']);
    expect(merged).toEqual(['Bob Jones']);
  });
});
