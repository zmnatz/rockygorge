import { describe, it, expect } from 'vitest';
import { isItemMatch } from '@/utils/item-match';
import type { PaypalTransaction } from '@/types/paypal';

const banquet = { slug: 'banquet', title: '2026 Banquet', description: 'Banquet Tickets' };

function transaction(itemTitle: string, overrides: Partial<PaypalTransaction> = {}): PaypalTransaction {
  return {
    date: '2026-05-01',
    name: 'Jane Doe',
    email: 'jane@example.com',
    type: 'Payment',
    status: 'S',
    itemTitle,
    itemSlug: '',
    gross: 100,
    fee: -3,
    net: 97,
    txnId: 'TXN-1',
    ...overrides,
  };
}

describe('isItemMatch', () => {
  it('matches authoritatively by item slug, ignoring the item title text', () => {
    expect(isItemMatch(transaction('Open Enrollment', { itemSlug: 'banquet' }), banquet)).toBe(true);
  });

  it('matches when the item title contains the description', () => {
    expect(isItemMatch(transaction('Banquet Tickets'), banquet)).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isItemMatch(transaction('banquet TICKETS'), banquet)).toBe(true);
  });

  it('falls back to matching the title when no description matches', () => {
    expect(isItemMatch(transaction('2026 Banquet'), banquet)).toBe(true);
  });

  it('rejects a transaction matching neither description nor title', () => {
    expect(isItemMatch(transaction('Rocky Gorge Open'), banquet)).toBe(false);
  });

  it('rejects an empty item title', () => {
    expect(isItemMatch(transaction(''), banquet)).toBe(false);
  });

  it('requires the full description, not a bare substring of it', () => {
    expect(isItemMatch(transaction('Banquet'), banquet)).toBe(false);
  });

  it('does not match when the item text appears as a substring of an unrelated title', () => {
    const open = { slug: 'open', title: '2026 Rocky Gorge Open', description: 'Rocky Gorge Open' };
    expect(isItemMatch(transaction('Open Enrollment'), open)).toBe(false);
  });
});
