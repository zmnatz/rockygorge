import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import yaml from 'js-yaml';
import { FormField } from '@/components/AdminPage/FormField';
import type { FieldConfig } from '@/components/AdminPage/types';
import { applyItemChange, createDefaultItem } from '@/utils/admin-items';

interface SectionItem {
  source: string;
}

const selectField: FieldConfig<SectionItem> = {
  name: 'source',
  label: 'Source',
  type: 'select',
  options: ['store', 'events', 'links'],
};

describe('FormField select', () => {
  it('renders a select control labelled with the field label showing the current value', () => {
    const html = renderToStaticMarkup(
      <FormField field={selectField} item={{ source: 'events' }} onChange={() => {}} />
    );

    expect(html).toContain('combobox');
    expect(html).toContain('MuiSelect-select');
    expect(html).toContain('Source');
    expect(html).toContain('events');
  });

  it('does not render a free-text input for the selected value', () => {
    const html = renderToStaticMarkup(
      <FormField field={selectField} item={{ source: 'events' }} onChange={() => {}} />
    );

    expect(html).not.toContain('type="text"');
  });

  it('offers a blank placeholder option alongside the configured options', () => {
    const fs = require('node:fs');
    const source = fs.readFileSync(
      require('node:path').join(__dirname, '../components/AdminPage/FormField.tsx'),
      'utf8'
    );

    expect(source).toContain('<MenuItem value=""><em>Select...</em></MenuItem>');
  });
});

describe('select value save pipeline', () => {
  function saveAndLoad(items: any[]): any[] {
    const json = JSON.stringify(items);
    const serverParsed = JSON.parse(json);
    const yamlOutput = yaml.dump(serverParsed);
    return yaml.load(yamlOutput) as any[];
  }

  it('persists a chosen select value through the save + YAML roundtrip', () => {
    const items = [
      { slug: 'section-1', source: 'events', title: 'Events' },
      { slug: 'section-2', source: 'links', title: 'Links' },
    ];

    const loaded = saveAndLoad(items);

    expect(loaded[0].source).toBe('events');
    expect(loaded[1].source).toBe('links');
  });

  it('merges a value picked from the dropdown into the item before save', () => {
    const items = [
      { slug: 'section-1', source: 'store', title: 'Store' },
    ];
    const chosen = selectField.options[2];

    const editingItem = { ...items[0], source: chosen };
    const itemsToSave = applyItemChange(items, editingItem, 'section-1', (item: any) => item.slug);
    const [loaded] = saveAndLoad(itemsToSave);

    expect(loaded.source).toBe(chosen);
  });

  it('keeps other items unchanged when one select value is edited', () => {
    const items = [
      { slug: 'section-1', source: 'store', title: 'Store' },
      { slug: 'section-2', source: 'events', title: 'Events' },
    ];

    const editingItem = { ...items[0], source: 'links' };
    const itemsToSave = applyItemChange(items, editingItem, 'section-1', (item: any) => item.slug);

    expect(itemsToSave[0].source).toBe('links');
    expect(itemsToSave[1].source).toBe('events');
  });

  it('defaults a new item select field to a blank value', () => {
    const item = createDefaultItem([selectField], {});

    expect(item.source).toBe('');
  });
});
