import { describe, it, expect } from 'vitest';
import { itemMatcher, itemSlugsMatching } from '@/utils/item-match';
import type { PaypalTransaction } from '@/types/paypal';

const banquet = { slug: 'banquet', title: '2026 Banquet', description: 'Banquet Tickets' };

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
  slug: 'dues',
  title: 'Pay your dues. Play rugby.',
  description: 'Fall Dues',
  subscriptions: [
    {
      name: "Player's Tier",
      id: 'SFWCNPKX3WKF2',
      description: 'Covers team gear, player dues, film analysis.',
      keywords: ['Dues Subscription'],
      options: [
        { label: 'Option 1 : $35.00 USD - monthly', value: 'Option 1' },
        { label: 'Option 2 : $400.00 USD - yearly', value: 'Option 2' },
      ],
    },
    godTier,
  ],
};

const supporters = {
  slug: 'supporters',
  title: 'Pay your damn dues! Support Rocky Gorge Rugby.',
  description: 'Supporter Dues',
  subscriptions: [
    {
      ...godTier,
      options: [...godTier.options, { label: 'Sponsor a Player : $200.00 USD - yearly', value: 'Sponsor a Player' }],
    },
  ],
};

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

describe('itemMatcher', () => {
  it('matches authoritatively by item slug, ignoring the item title text', () => {
    expect(itemMatcher(banquet)(transaction('Open Enrollment', { itemSlug: 'banquet' }))).toBe(true);
  });

  it('rejects a slug-carrying transaction for a different item even when its title text matches', () => {
    const open = { slug: 'open', title: '2026 Rocky Gorge Open', description: 'Banquet Tickets' };
    expect(itemMatcher(open)(transaction('Banquet Tickets', { itemSlug: 'banquet' }))).toBe(false);
  });

  it('matches when the item title contains the description', () => {
    expect(itemMatcher(banquet)(transaction('Banquet Tickets'))).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(itemMatcher(banquet)(transaction('banquet TICKETS'))).toBe(true);
  });

  it('falls back to matching the title when no description matches', () => {
    expect(itemMatcher(banquet)(transaction('2026 Banquet'))).toBe(true);
  });

  it('rejects a transaction matching neither description nor title', () => {
    expect(itemMatcher(banquet)(transaction('Rocky Gorge Open'))).toBe(false);
  });

  it('rejects an empty item title', () => {
    expect(itemMatcher(banquet)(transaction(''))).toBe(false);
  });

  it('requires the full description, not a bare substring of it', () => {
    expect(itemMatcher(banquet)(transaction('Banquet'))).toBe(false);
  });

  it('does not match when the item text appears as a substring of an unrelated title', () => {
    const open = { slug: 'open', title: '2026 Rocky Gorge Open', description: 'Rocky Gorge Open' };
    expect(itemMatcher(open)(transaction('Open Enrollment'))).toBe(false);
  });
});

describe('itemMatcher — subscription billing', () => {
  it('attributes a subscription payment whose item title contains the plan name', () => {
    expect(itemMatcher(dues)(transaction("Player's Tier"))).toBe(true);
  });

  it('attributes a subscription payment by the hosted button id', () => {
    expect(itemMatcher(dues)(transaction('SQ4FBM547W67C'))).toBe(true);
  });

  it('attributes a subscription payment by the chosen option value', () => {
    expect(itemMatcher(dues)(transaction('GODs: $20.00 USD - monthly'))).toBe(true);
    expect(itemMatcher(dues)(transaction('Supporter'))).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(itemMatcher(dues)(transaction("player's TIER"))).toBe(true);
    expect(itemMatcher(dues)(transaction('gods'))).toBe(true);
  });

  it('attributes a recurring payment that carries no store-item description', () => {
    expect(itemMatcher(dues)(transaction('GODs'))).toBe(true);
  });

  it('does not treat the generic plan value field as a match key', () => {
    expect(itemMatcher(dues)(transaction('DUES'))).toBe(false);
  });

  it('does not pull a one-time "Fall Dues" purchase onto the supporters item', () => {
    expect(itemMatcher(supporters)(transaction('Fall Dues'))).toBe(false);
  });

  it('still matches the one-time purchase on the dues item', () => {
    expect(itemMatcher(dues)(transaction('Fall Dues'))).toBe(true);
  });

  it('applies subscription keys only to items that carry subscriptions', () => {
    expect(itemMatcher(banquet)(transaction("Player's Tier"))).toBe(false);
  });

  it('attributes a subscription payment by an explicit plan keyword', () => {
    expect(itemMatcher(dues)(transaction('Rocky Gorge Yearly Dues Subscription'))).toBe(true);
    expect(itemMatcher(dues)(transaction('Rocky Gorge Monthly Dues Subscription'))).toBe(true);
  });

  it('does not let a plan keyword pull the payment onto another item', () => {
    expect(itemMatcher(supporters)(transaction('Rocky Gorge Yearly Dues Subscription'))).toBe(false);
  });
});

describe('itemSlugsMatching', () => {
  const items = [
    { slug: 'banquet', title: '2026 Banquet', description: 'Banquet Tickets' },
    { slug: 'open', title: '2026 Rocky Gorge Open', description: 'Rocky Gorge Open' },
  ];

  it('returns the slugs whose description or title contains the query', () => {
    expect(itemSlugsMatching(items, 'banquet tickets')).toEqual(new Set(['banquet']));
    expect(itemSlugsMatching(items, '2026')).toEqual(new Set(['banquet', 'open']));
  });

  it('returns no slugs for an empty query', () => {
    expect(itemSlugsMatching(items, '  ')).toEqual(new Set());
  });
});
