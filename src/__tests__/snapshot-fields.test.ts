import { describe, it, expect } from 'vitest';
import { dump, load } from 'js-yaml';
import adminYaml from '@config/admin.yml';
import { createDefaultItem } from '@/utils/admin-items';

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

const SNAPSHOT_TYPES = ['store', 'events'] as const;

const SNAPSHOT_VALUES = {
  location: 'The Meeting House, 5885 Robert Oliver Place',
  start: '2026-06-20T18:00:00-04:00',
  end: '2026-06-20T21:00:00-04:00',
};

function buildDefaultItem(type: string): Record<string, unknown> {
  const config = adminConfig[type];
  const fields = config.fields.map((f) => ({ name: f.name, type: f.type }));
  return createDefaultItem(fields, config.createDefaults || {});
}

function serialize(data: unknown): unknown {
  return load(dump(data));
}

describe('snapshot fields on generatable content types', () => {
  SNAPSHOT_TYPES.forEach((type) => {
    describe(type, () => {
      it('declares editable text fields for location, start, and end', () => {
        const config = adminConfig[type];
        const fieldNames = config.fields.map((f) => f.name);
        ['location', 'start', 'end'].forEach((name) => {
          expect(fieldNames).toContain(name);
          const field = config.fields.find((f) => f.name === name);
          expect(field?.type).toBe('text');
        });
      });

      it('defaults a new item to blank snapshot fields', () => {
        const item = buildDefaultItem(type);
        ['location', 'start', 'end'].forEach((name) => {
          expect(item[name]).toBe('');
        });
      });

      it('persists snapshot values through the admin save and YAML roundtrip', () => {
        const item = buildDefaultItem(type);
        item.slug = `test-snapshot-${type}`;
        item.location = SNAPSHOT_VALUES.location;
        item.start = SNAPSHOT_VALUES.start;
        item.end = SNAPSHOT_VALUES.end;

        const saved = serialize([item]);
        const [savedItem] = saved as Record<string, unknown>[];

        expect(savedItem.slug).toBe(`test-snapshot-${type}`);
        expect(savedItem.location).toBe(SNAPSHOT_VALUES.location);
        expect(savedItem.start).toBe(SNAPSHOT_VALUES.start);
        expect(savedItem.end).toBe(SNAPSHOT_VALUES.end);
      });

      it('keeps hidden-by-default behavior for new items', () => {
        const item = buildDefaultItem(type);
        expect(item.hide).toBe(true);
      });
    });
  });
});