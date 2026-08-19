import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { simulateServerSave } from './helpers/yaml-roundtrip';
import { FormField } from '@/components/AdminPage/FormField';
import type { FieldConfig } from '@/components/AdminPage/types';
import type { Product, SubscriptionItem } from '@/types/data';
import { applyItemChange } from '@/utils/admin-items';

const subscriptionsField: FieldConfig<Product> = {
  name: 'subscriptions',
  label: 'Subscriptions',
  type: 'subscriptionList',
};

const item: Product = {
  slug: 'dues',
  title: 'Pay your dues. Play rugby.',
  description: 'Player dues',
  summary: 'Fall Season: $220',
  defaultAmount: 220,
  options: [],
  subscriptions: [
    {
      name: "Player's Tier",
      id: 'SFWCNPKX3WKF2',
      description: 'Covers team gear, player dues, film analysis.',
      value: 'DUES',
      options: [
        { label: 'Option 1 : $35.00 USD - monthly', value: 'Option 1' },
        { label: 'Option 2 : $400.00 USD - yearly', value: 'Option 2' },
      ],
    },
  ],
};

describe('FormField subscriptionList', () => {
  it('renders a heading with the field label', () => {
    const html = renderToStaticMarkup(
      <FormField field={subscriptionsField} item={item} onChange={() => {}} />
    );

    expect(html).toContain('Subscriptions');
  });

  it('renders each subscription name, id, and description value', () => {
    const html = renderToStaticMarkup(
      <FormField field={subscriptionsField} item={item} onChange={() => {}} />
    );

    expect(html).toContain('Player&#x27;s Tier');
    expect(html).toContain('SFWCNPKX3WKF2');
    expect(html).toContain('Covers team gear, player dues, film analysis.');
  });

  it('renders the optional value field when present', () => {
    const html = renderToStaticMarkup(
      <FormField field={subscriptionsField} item={item} onChange={() => {}} />
    );

    expect(html).toContain('DUES');
  });

  it('renders option labels and values inside each subscription', () => {
    const html = renderToStaticMarkup(
      <FormField field={subscriptionsField} item={item} onChange={() => {}} />
    );

    expect(html).toContain('Option 1 : $35.00 USD - monthly');
    expect(html).toContain('Option 2 : $400.00 USD - yearly');
  });

  it('offers an add-subscription button and per-subscription delete buttons', () => {
    const html = renderToStaticMarkup(
      <FormField field={subscriptionsField} item={item} onChange={() => {}} />
    );

    expect(html).toContain('Add Subscription');
    expect(html).toContain('aria-label');
  });

  it('offers an add-option button for each subscription', () => {
    const html = renderToStaticMarkup(
      <FormField field={subscriptionsField} item={item} onChange={() => {}} />
    );

    expect(html).toContain('Add Option');
  });

  it('renders an empty addable list when subscriptions is absent', () => {
    const { subscriptions: _absent, ...withoutSubscriptions } = item;

    const html = renderToStaticMarkup(
      <FormField field={subscriptionsField} item={withoutSubscriptions} onChange={() => {}} />
    );

    expect(html).toContain('Subscriptions');
    expect(html).toContain('Add Subscription');
    expect(html).not.toContain("Player's Tier");
  });

  it('renders a subscription that omits options without crashing', () => {
    const withMissingOptions: Product = {
      ...item,
      subscriptions: [{ name: 'GODs Tier', id: 'SQ4FBM547W67C', description: 'Covers gear.' }] as unknown as SubscriptionItem[],
    };

    const html = renderToStaticMarkup(
      <FormField field={subscriptionsField} item={withMissingOptions} onChange={() => {}} />
    );

    expect(html).toContain('GODs Tier');
    expect(html).toContain('Add Option');
  });
});

describe('subscription save pipeline', () => {
  it('round-trips nested subscription values through the save + YAML roundtrip', () => {
    const items: Product[] = [item];

    const loaded = simulateServerSave<Product[]>(items);

    expect(loaded[0].subscriptions).toEqual([
      {
        name: "Player's Tier",
        id: 'SFWCNPKX3WKF2',
        description: 'Covers team gear, player dues, film analysis.',
        value: 'DUES',
        options: [
          { label: 'Option 1 : $35.00 USD - monthly', value: 'Option 1' },
          { label: 'Option 2 : $400.00 USD - yearly', value: 'Option 2' },
        ],
      },
    ]);
  });

  it('merges an edited subscription item into the list before save', () => {
    const items: Product[] = [item];
    const edited: Product = {
      ...item,
      subscriptions: [
        {
          name: "Player's Tier",
          id: 'SFWCNPKX3WKF2',
          description: 'Covers team gear, player dues, film analysis.',
          value: 'DUES',
          options: [{ label: 'Option 1 : $35.00 USD - monthly', value: 'Option 1' }],
        },
      ],
    };

    const itemsToSave = applyItemChange(items, edited, 'dues', (p) => p.slug);
    const [loaded] = simulateServerSave<Product[]>(itemsToSave);

    expect(loaded.subscriptions).toHaveLength(1);
    expect(loaded.subscriptions?.[0].options).toHaveLength(1);
  });

  it('keeps other items unchanged when one item is edited', () => {
    const other: Product = {
      slug: 'supporters',
      title: 'Support Rocky Gorge Rugby.',
      description: 'Supporter Dues',
      summary: 'Help us support the Rocky Gorge community.',
      defaultAmount: 200,
      options: [],
    };

    const items: Product[] = [item, other];
    const originalSubscription = item.subscriptions?.[0];
    const edited: Product = {
      ...item,
      subscriptions: originalSubscription ? [{ ...originalSubscription, name: 'GODs Tier' }] : [],
    };

    const itemsToSave = applyItemChange(items, edited, 'dues', (p) => p.slug);
    const [first, second] = simulateServerSave<Product[]>(itemsToSave);

    expect(first.subscriptions?.[0].name).toBe('GODs Tier');
    expect(second.subscriptions).toBeUndefined();
  });
});
