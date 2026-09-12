import { describe, it, expect } from 'vitest';
import { simulateServerSave } from './helpers/yaml-roundtrip';
import { ITEM_ID_MAPPINGS, TRANSFORM_MAPPINGS } from '@/utils/admin-config';

interface AdminItem {
  slug: string;
  home?: boolean;
  title?: string;
  [key: string]: unknown;
}

interface CalendarItem {
  name: string;
  hideSummary?: boolean;
  matches?: string;
  notMatches?: string;
  [key: string]: unknown;
}

type CalendarGlobals = {
  months: number;
};

interface CalendarSaveResult {
  months: number;
  filters: CalendarItem[];
}

function getItemId(item: AdminItem, strategy: string = 'slug'): string {
  const fn = ITEM_ID_MAPPINGS[strategy] || ((item: AdminItem) => String(item.id || ''));
  return fn(item);
}

function identitySaveTransform(items: AdminItem[], _globals?: unknown): AdminItem[] {
  return items;
}

function calendarSaveTransform(items: CalendarItem[], globals: CalendarGlobals): CalendarSaveResult {
  return TRANSFORM_MAPPINGS.calendar.saveDataTransform(items, globals) as CalendarSaveResult;
}

describe('boolean save pipeline - identity transform (store/events/links/forms)', () => {
  it('preserves boolean true through the full pipeline', () => {
    const items: AdminItem[] = [
      { slug: 'item1', home: true, title: 'Item 1' },
      { slug: 'item2', home: false, title: 'Item 2' },
    ];

    const data = identitySaveTransform(items);
    const loaded = simulateServerSave<AdminItem[]>(data);

    expect(loaded[0].home).toBe(true);
    expect(loaded[1].home).toBe(false);
  });

  it('preserves boolean false through the full pipeline', () => {
    const items: AdminItem[] = [
      { slug: 'item1', home: false, title: 'Item 1' },
    ];

    const data = identitySaveTransform(items);
    const loaded = simulateServerSave<AdminItem[]>(data);

    expect(loaded[0].home).toBe(false);
  });

  it('preserves home field when toggled from true to false', () => {
    const originalItems: AdminItem[] = [
      { slug: 'banquet', home: true, title: 'Banquet' },
      { slug: 'open', home: false, title: 'Open' },
    ];

    // User toggles banquet's home from true to false
    const updatedItems = originalItems.map(item =>
      item.slug === 'banquet' ? { ...item, home: false } : item
    );

    const data = identitySaveTransform(updatedItems);
    const loaded = simulateServerSave<AdminItem[]>(data);

    expect(loaded[0].home).toBe(false);
    expect(loaded[1].home).toBe(false);
  });

  it('preserves home field when toggled from false to true', () => {
    const originalItems: AdminItem[] = [
      { slug: 'item1', home: false, title: 'Item 1' },
    ];

    const updatedItems = originalItems.map(item =>
      ({ ...item, home: true })
    );

    const data = identitySaveTransform(updatedItems);
    const loaded = simulateServerSave<AdminItem[]>(data);

    expect(loaded[0].home).toBe(true);
  });

  it('adds home field when item did not previously have one', () => {
    const originalItems: AdminItem[] = [
      { slug: 'item1', title: 'Item 1' },  // no home field
    ];

    // User toggles checkbox to checked (true)
    const updatedItems = originalItems.map(item =>
      ({ ...item, home: true })
    );

    const data = identitySaveTransform(updatedItems);
    const loaded = simulateServerSave<AdminItem[]>(data);

    expect(loaded[0].home).toBe(true);
  });

  it('removes none of the fields when home is present', () => {
    const originalItems: AdminItem[] = [
      { slug: 'item1', home: true, title: 'Item 1', description: 'Test' },
    ];

    const updatedItems = originalItems.map(item =>
      ({ ...item, home: false })
    );

    const data = identitySaveTransform(updatedItems);
    const loaded = simulateServerSave<AdminItem[]>(data);

    expect(loaded[0]).toHaveProperty('slug', 'item1');
    expect(loaded[0]).toHaveProperty('home', false);
    expect(loaded[0]).toHaveProperty('title', 'Item 1');
    expect(loaded[0]).toHaveProperty('description', 'Test');
  });
});

describe('boolean save pipeline - calendar transform', () => {
  it('preserves hideSummary fields through the calendar save transform', () => {
    const items: CalendarItem[] = [
      { name: 'Training', hideSummary: true, matches: 'practice|training' },
      { name: 'Events', hideSummary: false, notMatches: 'practice|board' },
      { name: 'Board Meetings', hideSummary: false, matches: 'Board' },
    ];
    const globals: CalendarGlobals = { months: 3 };

    const data = calendarSaveTransform(items, globals);
    const loaded = simulateServerSave<CalendarSaveResult>(data);

    expect(loaded.months).toBe(3);
    expect(loaded.filters[0].hideSummary).toBe(true);
    expect(loaded.filters[1].hideSummary).toBe(false);
    expect(loaded.filters[2].hideSummary).toBe(false);
  });

  it('preserves hideSummary field when item did not previously have one', () => {
    const items: CalendarItem[] = [
      { name: 'Events', notMatches: 'practice|board' },  // no hideSummary
    ];
    const globals: CalendarGlobals = { months: 3 };

    // Simulate user checking the checkbox (sets hideSummary from undefined to true)
    const updatedItems = items.map(item =>
      ({ ...item, hideSummary: true })
    );

    const data = calendarSaveTransform(updatedItems, globals);
    const loaded = simulateServerSave<CalendarSaveResult>(data);

    expect(loaded.filters[0].hideSummary).toBe(true);
  });
});

describe('AdminPage save flow - dialog edits propagate to save', () => {
  it('merges editingItem into items before save, preserving checkbox toggle', () => {
    const items: AdminItem[] = [
      { slug: 'banquet', home: true, title: 'Banquet' },
    ];
    const editingItem: AdminItem = { slug: 'banquet', home: false, title: 'Banquet' };

    const itemsToSave = editingItem
      ? items.map(item => getItemId(item, 'slug') === getItemId(editingItem, 'slug') ? editingItem : item)
      : items;

    const data = identitySaveTransform(itemsToSave);
    const json = JSON.stringify(data);
    const parsed = JSON.parse(json);

    expect(parsed[0].home).toBe(false);
  });

  it('merges newly added boolean field from dialog into items before save', () => {
    const items: AdminItem[] = [
      { slug: 'dues', title: 'Dues' },
    ];
    const editingItem: AdminItem = { slug: 'dues', title: 'Dues', home: true };

    const itemsToSave = editingItem
      ? items.map(item => getItemId(item, 'slug') === getItemId(editingItem, 'slug') ? editingItem : item)
      : items;

    const data = identitySaveTransform(itemsToSave);
    const json = JSON.stringify(data);
    const parsed = JSON.parse(json);

    expect(parsed[0].home).toBe(true);
  });

  it('saves items as-is when editingItem is null', () => {
    const items: AdminItem[] = [
      { slug: 'banquet', home: true, title: 'Banquet' },
    ];
    const editingItem: AdminItem | null = null;

    const itemsToSave = editingItem
      ? items.map(item => getItemId(item, 'slug') === getItemId(editingItem, 'slug') ? editingItem : item)
      : items;

    const data = identitySaveTransform(itemsToSave);
    const json = JSON.stringify(data);
    const parsed = JSON.parse(json);

    expect(parsed[0].home).toBe(true);
  });

  it('preserves boolean toggle through handleSaveItem + handleSaveAll flow', () => {
    const items: AdminItem[] = [
      { slug: 'banquet', home: true, title: 'Banquet' },
      { slug: 'open', home: false, title: 'Open' },
    ];

    // Simulate: user opens dialog for 'banquet', toggles home to false, clicks 'Save to List'
    const editingItem: AdminItem = { slug: 'banquet', home: false, title: 'Banquet' };
    const updated = items.map(item =>
      getItemId(item, 'slug') === getItemId(editingItem, 'slug') ? editingItem : item
    );

    // Verify handleSaveItem correctly replaced the item
    expect(updated[0].home).toBe(false);
    expect(updated[1].home).toBe(false);

    // Simulate: user clicks 'Save All Changes' (editingItem is null, uses items directly)
    const data = identitySaveTransform(updated);
    const json = JSON.stringify(data);
    const parsed = JSON.parse(json);

    expect(parsed[0].home).toBe(false);
    expect(parsed[1].home).toBe(false);
  });

  it('does not corrupt other items when merging editingItem', () => {
    const items: AdminItem[] = [
      { slug: 'banquet', home: true, title: 'Banquet' },
      { slug: 'open', home: false, title: 'Open' },
      { slug: 'donations', home: true, title: 'Donations' },
    ];
    const editingItem: AdminItem = { slug: 'banquet', home: false, title: 'Banquet' };

    const itemsToSave = editingItem
      ? items.map(item => getItemId(item, 'slug') === getItemId(editingItem, 'slug') ? editingItem : item)
      : items;

    expect(itemsToSave[0].home).toBe(false);
    expect(itemsToSave[1].home).toBe(false);
    expect(itemsToSave[2].home).toBe(true);
  });
});