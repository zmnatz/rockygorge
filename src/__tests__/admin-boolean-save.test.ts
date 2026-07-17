import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';

const ITEM_ID_MAPPINGS: Record<string, (item: any) => string> = {
  slug: (item) => item.slug,
  name: (item) => item.name,
  type: (item) => item.type,
};

function getItemId(item: any, strategy: string = 'slug'): string {
  const fn = ITEM_ID_MAPPINGS[strategy] || ((item: any) => item.id);
  return fn(item);
}

function identitySaveTransform(items: any[], globals?: any) {
  return items;
}

function calendarSaveTransform(items: any[], globals: any) {
  return {
    months: globals.months,
    filters: items,
  };
}

function linkMappingsSaveTransform(items: any[]) {
  const result: Record<string, any> = {};
  items.forEach((item: any) => {
    const mappings: Record<string, any> = {};
    (item.mappings || []).forEach((m: any) => {
      mappings[m.name] = m.value;
    });
    result[item.type] = {
      mappings,
      default: item.default,
    };
  });
  return result;
}

function serializeToYaml(data: any): string {
  // Simulate the server's admin-handler flow:
  // body is already JSON-parsed by Netlify, then yaml.dump is called
  if (typeof data === 'string') {
    return yaml.dump(JSON.parse(data));
  }
  return yaml.dump(data);
}

describe('boolean save pipeline - identity transform (store/events/links/forms)', () => {
  it('preserves boolean true through the full pipeline', () => {
    const items = [
      { slug: 'item1', hide: true, title: 'Item 1' },
      { slug: 'item2', hide: false, title: 'Item 2' },
    ];

    const data = identitySaveTransform(items);
    const json = JSON.stringify(data);
    const serverParsed = JSON.parse(json);
    const yamlOutput = serializeToYaml(serverParsed);
    const loaded = yaml.load(yamlOutput) as any[];

    expect(loaded[0].hide).toBe(true);
    expect(loaded[1].hide).toBe(false);
  });

  it('preserves boolean false through the full pipeline', () => {
    const items = [
      { slug: 'item1', hide: false, title: 'Item 1' },
    ];

    const data = identitySaveTransform(items);
    const json = JSON.stringify(data);
    const serverParsed = JSON.parse(json);
    const yamlOutput = serializeToYaml(serverParsed);
    const loaded = yaml.load(yamlOutput) as any[];

    expect(loaded[0].hide).toBe(false);
  });

  it('preserves hide field when toggled from true to false', () => {
    const originalItems = [
      { slug: 'banquet', hide: true, title: 'Banquet' },
      { slug: 'open', hide: false, title: 'Open' },
    ];

    // User toggles banquet's hide from true to false
    const updatedItems = originalItems.map(item =>
      item.slug === 'banquet' ? { ...item, hide: false } : item
    );

    const data = identitySaveTransform(updatedItems);
    const json = JSON.stringify(data);
    const serverParsed = JSON.parse(json);
    const yamlOutput = serializeToYaml(serverParsed);
    const loaded = yaml.load(yamlOutput) as any[];

    expect(loaded[0].hide).toBe(false);
    expect(loaded[1].hide).toBe(false);
  });

  it('preserves hide field when toggled from false to true', () => {
    const originalItems = [
      { slug: 'item1', hide: false, title: 'Item 1' },
    ];

    const updatedItems = originalItems.map(item =>
      ({ ...item, hide: true })
    );

    const data = identitySaveTransform(updatedItems);
    const json = JSON.stringify(data);
    const serverParsed = JSON.parse(json);
    const yamlOutput = serializeToYaml(serverParsed);
    const loaded = yaml.load(yamlOutput) as any[];

    expect(loaded[0].hide).toBe(true);
  });

  it('adds hide field when item did not previously have one', () => {
    const originalItems = [
      { slug: 'item1', title: 'Item 1' },  // no hide field
    ];

    // User toggles checkbox to checked (true)
    const updatedItems = originalItems.map(item =>
      ({ ...item, hide: true })
    );

    const data = identitySaveTransform(updatedItems);
    const json = JSON.stringify(data);
    const serverParsed = JSON.parse(json);
    const yamlOutput = serializeToYaml(serverParsed);
    const loaded = yaml.load(yamlOutput) as any[];

    expect(loaded[0].hide).toBe(true);
  });

  it('removes none of the fields when hide is present', () => {
    const originalItems = [
      { slug: 'item1', hide: true, title: 'Item 1', description: 'Test' },
    ];

    const updatedItems = originalItems.map(item =>
      ({ ...item, hide: false })
    );

    const data = identitySaveTransform(updatedItems);
    const json = JSON.stringify(data);
    const serverParsed = JSON.parse(json);
    const yamlOutput = serializeToYaml(serverParsed);
    const loaded = yaml.load(yamlOutput) as any[];

    expect(loaded[0]).toHaveProperty('slug', 'item1');
    expect(loaded[0]).toHaveProperty('hide', false);
    expect(loaded[0]).toHaveProperty('title', 'Item 1');
    expect(loaded[0]).toHaveProperty('description', 'Test');
  });
});

describe('boolean save pipeline - calendar transform', () => {
  it('preserves hideSummary fields through the calendar save transform', () => {
    const items = [
      { name: 'Training', hideSummary: true, matches: 'practice|training' },
      { name: 'Events', hideSummary: false, notMatches: 'practice|board' },
      { name: 'Board Meetings', hideSummary: false, matches: 'Board' },
    ];
    const globals = { months: 3 };

    const data = calendarSaveTransform(items, globals);
    const json = JSON.stringify(data);
    const serverParsed = JSON.parse(json);
    const yamlOutput = serializeToYaml(serverParsed);
    const loaded = yaml.load(yamlOutput) as any;

    expect(loaded.months).toBe(3);
    expect(loaded.filters[0].hideSummary).toBe(true);
    expect(loaded.filters[1].hideSummary).toBe(false);
    expect(loaded.filters[2].hideSummary).toBe(false);
  });

  it('preserves hideSummary field when item did not previously have one', () => {
    const items = [
      { name: 'Events', notMatches: 'practice|board' },  // no hideSummary
    ];
    const globals = { months: 3 };

    // Simulate user checking the checkbox (sets hideSummary from undefined to true)
    const updatedItems = items.map(item =>
      ({ ...item, hideSummary: true })
    );

    const data = calendarSaveTransform(updatedItems, globals);
    const json = JSON.stringify(data);
    const serverParsed = JSON.parse(json);
    const yamlOutput = serializeToYaml(serverParsed);
    const loaded = yaml.load(yamlOutput) as any;

    expect(loaded.filters[0].hideSummary).toBe(true);
  });
});

describe('AdminPage save flow - dialog edits propagate to save', () => {
  it('merges editingItem into items before save, preserving checkbox toggle', () => {
    const items = [
      { slug: 'banquet', hide: true, title: 'Banquet' },
    ];
    const editingItem = { slug: 'banquet', hide: false, title: 'Banquet' };

    const itemsToSave = editingItem
      ? items.map(item => getItemId(item, 'slug') === getItemId(editingItem, 'slug') ? editingItem : item)
      : items;

    const data = identitySaveTransform(itemsToSave);
    const json = JSON.stringify(data);
    const parsed = JSON.parse(json);

    expect(parsed[0].hide).toBe(false);
  });

  it('merges newly added boolean field from dialog into items before save', () => {
    const items = [
      { slug: 'dues', title: 'Dues' },
    ];
    const editingItem = { slug: 'dues', title: 'Dues', hide: true };

    const itemsToSave = editingItem
      ? items.map(item => getItemId(item, 'slug') === getItemId(editingItem, 'slug') ? editingItem : item)
      : items;

    const data = identitySaveTransform(itemsToSave);
    const json = JSON.stringify(data);
    const parsed = JSON.parse(json);

    expect(parsed[0].hide).toBe(true);
  });

  it('saves items as-is when editingItem is null', () => {
    const items = [
      { slug: 'banquet', hide: true, title: 'Banquet' },
    ];
    const editingItem = null;

    const itemsToSave = editingItem
      ? items.map(item => getItemId(item, 'slug') === getItemId(editingItem, 'slug') ? editingItem : item)
      : items;

    const data = identitySaveTransform(itemsToSave);
    const json = JSON.stringify(data);
    const parsed = JSON.parse(json);

    expect(parsed[0].hide).toBe(true);
  });

  it('preserves boolean toggle through handleSaveItem + handleSaveAll flow', () => {
    const items = [
      { slug: 'banquet', hide: true, title: 'Banquet' },
      { slug: 'open', hide: false, title: 'Open' },
    ];

    // Simulate: user opens dialog for 'banquet', toggles hide to false, clicks 'Save to List'
    const editingItem = { slug: 'banquet', hide: false, title: 'Banquet' };
    const updated = items.map(item =>
      getItemId(item, 'slug') === getItemId(editingItem, 'slug') ? editingItem : item
    );

    // Verify handleSaveItem correctly replaced the item
    expect(updated[0].hide).toBe(false);
    expect(updated[1].hide).toBe(false);

    // Simulate: user clicks 'Save All Changes' (editingItem is null, uses items directly)
    const data = identitySaveTransform(updated);
    const json = JSON.stringify(data);
    const parsed = JSON.parse(json);

    expect(parsed[0].hide).toBe(false);
    expect(parsed[1].hide).toBe(false);
  });

  it('does not corrupt other items when merging editingItem', () => {
    const items = [
      { slug: 'banquet', hide: true, title: 'Banquet' },
      { slug: 'open', hide: false, title: 'Open' },
      { slug: 'donations', hide: true, title: 'Donations' },
    ];
    const editingItem = { slug: 'banquet', hide: false, title: 'Banquet' };

    const itemsToSave = editingItem
      ? items.map(item => getItemId(item, 'slug') === getItemId(editingItem, 'slug') ? editingItem : item)
      : items;

    expect(itemsToSave[0].hide).toBe(false);
    expect(itemsToSave[1].hide).toBe(false);
    expect(itemsToSave[2].hide).toBe(true);
  });
});

describe('AdminPage useEffect dependency stability', () => {
  it('does not include initialDataTransform or initialGlobalsTransform in useEffect deps', () => {
    const fs = require('fs');
    const source = fs.readFileSync(
      require('path').join(__dirname, '../components/AdminPage/AdminPage.tsx'),
      'utf8'
    );

    // Extract the useEffect hook and its dependency array
    const effectStart = source.indexOf('useEffect(() =>');
    const effectEnd = source.indexOf('const handleSaveItem', effectStart);
    const effectBlock = source.slice(effectStart, effectEnd);

    // Verify the dependency array is just [endpoint, initialData]
    expect(effectBlock).toContain('}, [endpoint, initialData]);');

    const depStart = effectBlock.indexOf('}, [') + 4;
    const depEnd = effectBlock.indexOf(']);', depStart);
    const depsStr = effectBlock.slice(depStart, depEnd);
    const deps = depsStr.split(',').map((d: string) => d.trim());
    expect(deps).toEqual(['endpoint', 'initialData']);
  });
});
