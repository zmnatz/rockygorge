import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import adminYaml from '@config/admin.yml';
import { ADMIN_FILE_PATHS } from '../utils/admin-file-paths';
import { createDefaultItem } from '../utils/admin-items';

const VALID_FIELD_TYPES = ['text', 'number', 'boolean', 'textarea', 'keyValueMap', 'textList', 'textKeyValueMap', 'select'];

interface AdminConfigField {
  name: string;
  label?: string;
  type?: string;
  options?: string[];
}

interface AdminConfigColumn {
  field: string;
  header?: string;
  render?: string;
}

interface AdminConfigGlobalField {
  name: string;
  label?: string;
  type?: string;
  options?: string[];
}

interface AdminYamlConfig {
  title: string;
  endpoint: string;
  getItemId: string;
  transforms?: string;
  columns: AdminConfigColumn[];
  fields: AdminConfigField[];
  globalFields?: AdminConfigGlobalField[];
  editOnly?: boolean;
  reorderable?: boolean;
  createDefaults?: Record<string, unknown>;
}

const adminConfig = adminYaml as Record<string, AdminYamlConfig>;

const ALL_CONFIG_FIELDS = Object.values(adminConfig).flatMap((config) => [
  ...(config.fields || []),
  ...(config.globalFields || []),
]);

describe('admin.yml', () => {
  it('is an object with at least one admin type', () => {
    expect(typeof adminYaml).toBe('object');
    expect(Object.keys(adminYaml).length).toBeGreaterThan(0);
  });

  it('every admin type has a registered file path pointing to an existing file', () => {
    Object.keys(adminYaml).forEach((type) => {
      expect(ADMIN_FILE_PATHS[type]).toBeTypeOf('string');
      const filePath = path.join(process.cwd(), ADMIN_FILE_PATHS[type]);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  it('select fields declare a non-empty options list', () => {
    ALL_CONFIG_FIELDS.forEach((field) => {
      if (field.type === 'select') {
        expect(Array.isArray(field.options)).toBe(true);
        expect(field.options?.length).toBeGreaterThan(0);
      }
    });
  });

  it('select options are strings', () => {
    ALL_CONFIG_FIELDS.forEach((field) => {
      if (field.type === 'select') {
        field.options?.forEach((option) => {
          expect(typeof option).toBe('string');
        });
      }
    });
  });

  Object.keys(adminYaml).forEach((type) => {
    const config = adminConfig[type];

    describe(`${type}`, () => {
      it('has required top-level fields', () => {
        expect(typeof config.title).toBe('string');
        expect(typeof config.endpoint).toBe('string');
        expect(typeof config.getItemId).toBe('string');
        expect(Array.isArray(config.columns)).toBe(true);
        expect(Array.isArray(config.fields)).toBe(true);
      });

      it('getItemId is a valid key name', () => {
        expect(['slug', 'name', 'type', 'source']).toContain(config.getItemId);
      });

      it('columns have a field property', () => {
        config.columns.forEach((col) => {
          expect(typeof col.field).toBe('string');
        });
      });

      it('fields have name and valid type', () => {
        config.fields.forEach((field) => {
          expect(typeof field.name).toBe('string');
          if (field.type) {
            expect(VALID_FIELD_TYPES).toContain(field.type);
          }
        });
      });

      it('globalFields have valid type when present', () => {
        if (config.globalFields) {
          config.globalFields.forEach((field) => {
            expect(typeof field.name).toBe('string');
            if (field.type) {
              expect(VALID_FIELD_TYPES).toContain(field.type);
            }
          });
        }
      });

      it('transforms references a known transform when present', () => {
        if (config.transforms) {
          expect(typeof config.transforms).toBe('string');
          expect(['calendar', 'linkMappings', 'home']).toContain(config.transforms);
        }
      });
    });
  });

  describe('create and delete capabilities', () => {
    const creatableTypes = ['store', 'events', 'links', 'forms', 'calendar', 'home'];
    const editOnlyTypes = ['link_mappings'];

    it('the creatable content pages are not edit-only', () => {
      creatableTypes.forEach((type) => {
        expect(adminConfig[type].editOnly).toBeFalsy();
      });
    });

    it('link_mappings keeps edit-only behavior', () => {
      expect(adminConfig.link_mappings.editOnly).toBe(true);
    });

    it('every creatable page has a field for its id', () => {
      creatableTypes.forEach((type) => {
        const config = adminConfig[type];
        const idField = config.getItemId;
        const fieldNames = config.fields.map((f) => f.name);
        expect(fieldNames).toContain(idField);
      });
    });

    it('store and forms supply the documented page-level create defaults', () => {
      const store = adminConfig.store;
      const forms = adminConfig.forms;
      expect(store.createDefaults?.defaultAmount).toBe(0);
      expect(forms.createDefaults?.width).toBe(640);
      expect(forms.createDefaults?.height).toBe(1000);
    });

    it('editOnly is either omitted or a boolean when present', () => {
      Object.values(adminConfig).forEach((config) => {
        if (config.editOnly !== undefined) {
          expect(typeof config.editOnly).toBe('boolean');
        }
      });
    });

    it('only the home page is reorderable', () => {
      Object.entries(adminConfig).forEach(([type, config]) => {
        if (type === 'home') {
          expect(config.reorderable).toBe(true);
        } else {
          expect(config.reorderable).toBeFalsy();
        }
      });
    });

    it('edit-only pages cannot also declare create defaults', () => {
      editOnlyTypes.forEach((type) => {
        expect(adminConfig[type].createDefaults).toBeUndefined();
      });
    });

    it('edit-only pages cannot declare a reorderable table', () => {
      editOnlyTypes.forEach((type) => {
        expect(adminConfig[type].reorderable).toBeFalsy();
      });
    });
  });

  describe('createDefaultItem', () => {
    const _getId = (item: Record<string, unknown>) => String(item.slug || '');

    it('generates a valid object for each admin type', () => {
      Object.keys(adminConfig).forEach((type) => {
        const config = adminConfig[type];
        const defaults = config.createDefaults || {};
        const item = createDefaultItem(config.fields, defaults);
        expect(item).toBeDefined();
        expect(typeof item).toBe('object');
      });
    });

    it('respects field type defaults', () => {
      const fields: AdminConfigField[] = [
        { name: 'textField', type: 'text' },
        { name: 'numField', type: 'number' },
        { name: 'boolField', type: 'boolean' },
        { name: 'listField', type: 'textList' },
        { name: 'mapField', type: 'keyValueMap' },
      ];
      const defaults = { numField: 42, boolField: true };
      const item = createDefaultItem(fields, defaults);
      expect(item.textField).toBe('');
      expect(item.numField).toBe(42);
      expect(item.boolField).toBe(true);
      expect(Array.isArray(item.listField)).toBe(true);
      expect(Array.isArray(item.mapField)).toBe(true);
    });

    it('merges provided createDefaults over type defaults', () => {
      const fields: AdminConfigField[] = [
        { name: 'title', type: 'text' },
        { name: 'amount', type: 'number' },
      ];
      const defaults = { amount: 100 };
      const item = createDefaultItem(fields, defaults);
      expect(item.title).toBe('');
      expect(item.amount).toBe(100);
    });
  });
});