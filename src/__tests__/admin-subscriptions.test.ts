import { describe, it, expect } from 'vitest';
import {
  addOption,
  addSubscription,
  createEmptySubscription,
  removeOption,
  removeSubscription,
  updateOption,
  updateSubscriptionField,
} from '@/utils/admin-subscriptions';
import type { SubscriptionItem } from '@/types/data';

describe('createEmptySubscription', () => {
  it('creates a blank subscription with an empty options list', () => {
    expect(createEmptySubscription()).toEqual({
      name: '',
      id: '',
      description: '',
      options: [],
    });
  });
});

describe('addSubscription', () => {
  it('appends a blank subscription to the end of the list', () => {
    const existing: SubscriptionItem[] = [
      { name: 'GODs Tier', id: 'SQ4FBM547W67C', description: 'Covers gear.', options: [] },
    ];

    const next = addSubscription(existing);

    expect(next).toHaveLength(2);
    expect(next[1]).toEqual(createEmptySubscription());
    expect(next[0]).toEqual(existing[0]);
  });

  it('does not mutate the original list', () => {
    const existing: SubscriptionItem[] = [];

    addSubscription(existing);

    expect(existing).toHaveLength(0);
  });
});

describe('removeSubscription', () => {
  it('removes the subscription at the given index', () => {
    const list: SubscriptionItem[] = [
      createEmptySubscription(),
      { name: 'GODs Tier', id: 'SQ4FBM547W67C', description: 'Covers gear.', options: [] },
    ];

    const next = removeSubscription(list, 0);

    expect(next).toHaveLength(1);
    expect(next[0].name).toBe('GODs Tier');
  });

  it('does not mutate the original list', () => {
    const list: SubscriptionItem[] = [createEmptySubscription()];

    removeSubscription(list, 0);

    expect(list).toHaveLength(1);
  });
});

describe('updateSubscriptionField', () => {
  const list: SubscriptionItem[] = [
    { name: 'GODs Tier', id: 'SQ4FBM547W67C', description: 'Covers gear.', options: [] },
  ];

  it('updates the name field', () => {
    const next = updateSubscriptionField(list, 0, 'name', 'GODs Supporter');

    expect(next[0].name).toBe('GODs Supporter');
    expect(next[0].id).toBe('SQ4FBM547W67C');
  });

  it('updates the id field', () => {
    const next = updateSubscriptionField(list, 0, 'id', 'NEWID');

    expect(next[0].id).toBe('NEWID');
  });

  it('updates the description field', () => {
    const next = updateSubscriptionField(list, 0, 'description', 'New blurb.');

    expect(next[0].description).toBe('New blurb.');
  });

  it('updates the optional value field', () => {
    const next = updateSubscriptionField(list, 0, 'value', 'DUES');

    expect(next[0].value).toBe('DUES');
  });

  it('leaves sibling subscriptions untouched', () => {
    const two: SubscriptionItem[] = [
      ...list,
      { name: 'Player Tier', id: 'SFWCNPKX3WKF2', description: 'Covers player dues.', options: [] },
    ];

    const next = updateSubscriptionField(two, 0, 'name', 'Renamed');

    expect(next[1].name).toBe('Player Tier');
  });

  it('does not mutate the original list or subscription', () => {
    const next = updateSubscriptionField(list, 0, 'name', 'Renamed');

    expect(list[0].name).toBe('GODs Tier');
    expect(next).not.toBe(list);
    expect(next[0]).not.toBe(list[0]);
  });
});

describe('addOption', () => {
  it('appends a blank label/value option to the subscription at the given index', () => {
    const list: SubscriptionItem[] = [
      {
        name: 'GODs Tier',
        id: 'SQ4FBM547W67C',
        description: 'Covers gear.',
        options: [{ label: 'GODs: $20.00 USD - monthly', value: 'GODs' }],
      },
    ];

    const next = addOption(list, 0);

    expect(next[0].options).toHaveLength(2);
    expect(next[0].options[1]).toEqual({ label: '', value: '' });
    expect(next[0].options[0]).toEqual({ label: 'GODs: $20.00 USD - monthly', value: 'GODs' });
  });

  it('does not mutate the original list or subscription', () => {
    const list: SubscriptionItem[] = [{ name: 'GODs Tier', id: 'X', description: 'Covers gear.', options: [] }];

    const next = addOption(list, 0);

    expect(list[0].options).toHaveLength(0);
    expect(next[0]).not.toBe(list[0]);
  });
});

describe('removeOption', () => {
  it('removes the option at the given index', () => {
    const list: SubscriptionItem[] = [
      {
        name: 'GODs Tier',
        id: 'SQ4FBM547W67C',
        description: 'Covers gear.',
        options: [
          { label: 'GODs: $20.00 USD - monthly', value: 'GODs' },
          { label: 'Supporter $10.00 USD - monthly', value: 'Supporter' },
        ],
      },
    ];

    const next = removeOption(list, 0, 0);

    expect(next[0].options).toHaveLength(1);
    expect(next[0].options[0].label).toBe('Supporter $10.00 USD - monthly');
  });

  it('does not mutate the original list or subscription', () => {
    const list: SubscriptionItem[] = [
      { name: 'GODs Tier', id: 'X', description: 'Covers gear.', options: [{ label: 'A', value: 'a' }] },
    ];

    const next = removeOption(list, 0, 0);

    expect(list[0].options).toHaveLength(1);
    expect(next[0]).not.toBe(list[0]);
  });
});

describe('updateOption', () => {
  const list: SubscriptionItem[] = [
    {
      name: 'GODs Tier',
      id: 'SQ4FBM547W67C',
      description: 'Covers gear.',
      options: [{ label: 'GODs: $20.00 USD - monthly', value: 'GODs' }],
    },
  ];

  it('updates the label field', () => {
    const next = updateOption(list, 0, 0, 'label', 'GODs: $25.00 USD - monthly');

    expect(next[0].options[0].label).toBe('GODs: $25.00 USD - monthly');
    expect(next[0].options[0].value).toBe('GODs');
  });

  it('updates the value field', () => {
    const next = updateOption(list, 0, 0, 'value', 'Supporter');

    expect(next[0].options[0].value).toBe('Supporter');
  });

  it('does not mutate the original list or option', () => {
    const next = updateOption(list, 0, 0, 'label', 'Renamed');

    expect(list[0].options[0].label).toBe('GODs: $20.00 USD - monthly');
    expect(next[0].options).not.toBe(list[0].options);
    expect(next[0].options[0]).not.toBe(list[0].options[0]);
  });
});
