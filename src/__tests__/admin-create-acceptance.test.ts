import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';
import adminYaml from '@config/admin.yml';
import { TRANSFORM_MAPPINGS, ITEM_ID_MAPPINGS } from '@/utils/admin-config';
import { createDefaultItem } from '@/utils/admin-items';

interface RequiredField {
  name: string;
  type: string;
  optional?: boolean;
}

interface PageShape {
  idField: string;
  transform: 'identity' | 'calendar';
  requiredFields: RequiredField[];
}

const PAGE_SHAPES: Record<string, PageShape> = {
  store: {
    idField: 'slug',
    transform: 'identity',
    requiredFields: [
      { name: 'slug', type: 'string' },
      { name: 'defaultAmount', type: 'number' },
      { name: 'description', type: 'string' },
      { name: 'summary', type: 'string' },
      { name: 'title', type: 'string' },
      { name: 'options', type: 'object' },
      { name: 'hide', type: 'boolean', optional: true },
    ],
  },
  events: {
    idField: 'slug',
    transform: 'identity',
    requiredFields: [
      { name: 'slug', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'summary', type: 'string' },
      { name: 'title', type: 'string' },
      { name: 'organizers', type: 'object' },
      { name: 'hide', type: 'boolean', optional: true },
    ],
  },
  links: {
    idField: 'slug',
    transform: 'identity',
    requiredFields: [
      { name: 'slug', type: 'string' },
      { name: 'href', type: 'string' },
      { name: 'title', type: 'string' },
      { name: 'summary', type: 'string' },
      { name: 'header', type: 'boolean' },
      { name: 'hide', type: 'boolean', optional: true },
    ],
  },
  forms: {
    idField: 'slug',
    transform: 'identity',
    requiredFields: [
      { name: 'slug', type: 'string' },
      { name: 'href', type: 'string' },
      { name: 'formId', type: 'string' },
      { name: 'title', type: 'string' },
      { name: 'width', type: 'number' },
      { name: 'height', type: 'number' },
      { name: 'hide', type: 'boolean' },
      { name: 'summary', type: 'string', optional: true },
      { name: 'formLink', type: 'string', optional: true },
    ],
  },
  calendar: {
    idField: 'name',
    transform: 'calendar',
    requiredFields: [{ name: 'name', type: 'string' }],
  },
};

const CREATABLE_TYPES = Object.keys(PAGE_SHAPES);

interface AdminYamlConfig {
  title: string;
  endpoint: string;
  getItemId: string;
  transforms?: string;
  columns: Array<{ field: string; header?: string; render?: string }>;
  fields: Array<{ name: string; type?: string }>;
  globalFields?: Array<{ name: string; type?: string }>;
  editOnly?: boolean;
  reorderable?: boolean;
  createDefaults?: Record<string, unknown>;
}

const adminConfig = adminYaml as Record<string, AdminYamlConfig>;

function serialize(data: unknown): unknown {
  const yamlOutput = yaml.dump(data);
  return yaml.load(yamlOutput);
}

function buildDefaultItem(type: string): Record<string, unknown> {
  const config = adminConfig[type];
  const fields = config.fields.map((f) => ({ name: f.name, type: f.type }));
  return createDefaultItem(fields, config.createDefaults || {});
}

function saveForPage(type: string, items: unknown[]): unknown {
  const shape = PAGE_SHAPES[type];
  if (shape.transform === 'calendar') {
    return TRANSFORM_MAPPINGS.calendar.saveDataTransform(items as Record<string, unknown>[], { months: 3 });
  }
  return items;
}

function extractItems(type: string, saved: unknown): unknown[] {
  return PAGE_SHAPES[type].transform === 'calendar' ? (saved as { filters: unknown[] }).filters : (saved as unknown[]);
}

describe('new item with only an id passes CI data-shape checks on every creatable page', () => {
  CREATABLE_TYPES.forEach((type) => {
    const shape = PAGE_SHAPES[type];

    describe(type, () => {
      it('defaults the visibility boolean to hidden for pages with a hide field', () => {
        const item = buildDefaultItem(type);
        if (type === 'calendar') {
          expect(item.hideSummary).toBe(false);
        } else {
          expect(item.hide).toBe(true);
        }
      });

      it('saves a default item with only its id filled in and survives the YAML roundtrip', () => {
        const item = buildDefaultItem(type);
        item[shape.idField] = `test-${type}`;

        const saved = saveForPage(type, [item]);
        const loaded = serialize(saved);
        const items = extractItems(type, loaded);
        expect(items).toHaveLength(1);
      });

      it('the saved item has every required field with the right type', () => {
        const item = buildDefaultItem(type);
        item[shape.idField] = `test-${type}`;

        const saved = saveForPage(type, [item]);
        const loaded = serialize(saved);
        const [savedItem] = extractItems(type, loaded) as Record<string, unknown>[];

        shape.requiredFields.forEach(({ name, type: expectedType, optional }) => {
          if (optional && savedItem[name] === undefined) return;
          expect(typeof savedItem[name], `${type}.${name}`).toBe(expectedType);
        });
      });

      if (type === 'forms') {
        it('defaults dimensions to positive values', () => {
          const item = buildDefaultItem(type);
          item.slug = 'test-forms';
          const loaded = serialize(saveForPage(type, [item]));
          const [savedItem] = extractItems(type, loaded) as Record<string, unknown>[];
          expect(savedItem.width).toBeGreaterThan(0);
          expect(savedItem.height).toBeGreaterThan(0);
        });
      }

      if (type === 'store') {
        it('defaults defaultAmount to a number', () => {
          const item = buildDefaultItem(type);
          item.slug = 'test-store';
          const loaded = serialize(saveForPage(type, [item]));
          const [savedItem] = extractItems(type, loaded) as Record<string, unknown>[];
          expect(typeof savedItem.defaultAmount).toBe('number');
        });
      }

      if (type === 'calendar') {
        it('does not force a zero limit that would fail the positive-limit check', () => {
          const item = buildDefaultItem(type);
          item.name = 'test-calendar';
          const loaded = serialize(saveForPage(type, [item]));
          const [savedItem] = extractItems(type, loaded) as Record<string, unknown>[];
          if (savedItem.limit !== undefined) {
            expect(savedItem.limit).toBeGreaterThan(0);
          }
        });
      }
    });
  });
});

describe('edit mode keeps existing items working when the id is unchanged', () => {
  it('merging an edited item by original id preserves other items', () => {
    const original = [
      { slug: 'a', hide: true },
      { slug: 'b', hide: false },
    ];
    const edited = { slug: 'a', hide: false };

    const merged = original.map((item) =>
      (ITEM_ID_MAPPINGS.slug(item) === ITEM_ID_MAPPINGS.slug(original[0]) ? edited : item)
    );

    expect(merged[0].hide).toBe(false);
    expect(merged[1].hide).toBe(false);
    expect(merged).toHaveLength(2);
  });
});