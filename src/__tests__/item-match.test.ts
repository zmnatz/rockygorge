import { describe, it, expect } from 'vitest';
import { isItemMatch } from '@/utils/item-match';
import type { PaypalTransaction } from '@/types/paypal';

const banquet = { title: '2026 Banquet', description: 'Banquet Tickets' };

const godTier = {
  name: 'GODs Tier',
  id: 'SQ4FBM547W67C',
  value: 'DUES',
  description: 'Covers team supporter gear.',
  options: [
    { label: 'GODs: $20.00 USD - monthly', value: 'GODs' },
    { label: 'Supporter $10.00 USD - monthly', value: 'Supporter' },
  ],
};

const dues = {
  title: 'Pay your dues. Play rugby.',
  description: 'Fall Dues',
  subscriptions: [
    {
      name: "Player's Tier",
      id: 'SFWCNPKX3WKF2',
      description: 'Covers team gear, player dues, film analysis.',
      options: [
        { label: 'Option 1 : $35.00 USD - monthly', value: 'Option 1' },
        { label: 'Option 2 : $400.00 USD - yearly', value: 'Option 2' },
      ],
    },
    godTier,
  ],
};

const supporters = {
  title: 'Pay your damn dues! Support Rocky Gorge Rugby.',
  description: 'Supporter Dues',
  subscriptions: [
    {
      ...godTier,
      options: [...godTier.options, { label: 'Sponsor a Player : $200.00 USD - yearly', value: 'Sponsor a Player' }],
    },
  ],
};

function transaction(itemTitle: string): PaypalTransaction {
  return {
    date: '2026-05-01',
    name: 'Jane Doe',
    email: 'jane@example.com',
    type: 'Payment',
    status: 'S',
    itemTitle,
    gross: 100,
    fee: -3,
    net: 97,
    txnId: 'TXN-1',
  };
}

describe('isItemMatch', () => {
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
    const open = { title: '2026 Rocky Gorge Open', description: 'Rocky Gorge Open' };
    expect(isItemMatch(transaction('Open Enrollment'), open)).toBe(false);
  });
});

describe('isItemMatch — subscription billing', () => {
  it('attributes a subscription payment whose item title contains the plan name', () => {
    expect(isItemMatch(transaction("Player's Tier"), dues)).toBe(true);
  });

  it('attributes a subscription payment by the hosted button id', () => {
    expect(isItemMatch(transaction('SQ4FBM547W67C'), dues)).toBe(true);
  });

  it('attributes a subscription payment by the chosen option value', () => {
    expect(isItemMatch(transaction('GODs: $20.00 USD - monthly'), dues)).toBe(true);
    expect(isItemMatch(transaction('Supporter'), dues)).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isItemMatch(transaction("player's TIER"), dues)).toBe(true);
    expect(isItemMatch(transaction('gods'), dues)).toBe(true);
  });

  it('attributes a recurring payment that carries no store-item description', () => {
    expect(isItemMatch(transaction('GODs'), dues)).toBe(true);
  });

  it('does not treat the generic plan value field as a match key', () => {
    expect(isItemMatch(transaction('DUES'), dues)).toBe(false);
  });

  it('does not pull a one-time "Fall Dues" purchase onto the supporters item', () => {
    expect(isItemMatch(transaction('Fall Dues'), supporters)).toBe(false);
  });

  it('still matches the one-time purchase on the dues item', () => {
    expect(isItemMatch(transaction('Fall Dues'), dues)).toBe(true);
  });

  it('applies subscription keys only to items that carry subscriptions', () => {
    expect(isItemMatch(transaction("Player's Tier"), banquet)).toBe(false);
  });
});
