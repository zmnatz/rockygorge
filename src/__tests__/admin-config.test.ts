import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import adminYaml from '@config/admin.yml';
import { ADMIN_FILE_PATHS } from '../utils/admin-file-paths';

const VALID_FIELD_TYPES = ['text', 'number', 'boolean', 'textarea', 'keyValueMap', 'textList', 'textKeyValueMap', 'select'];

const ALL_CONFIG_FIELDS = Object.values(adminYaml as any).flatMap((config: any) => [
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
    ALL_CONFIG_FIELDS.forEach((field: any) => {
      if (field.type === 'select') {
        expect(Array.isArray(field.options)).toBe(true);
        expect(field.options.length).toBeGreaterThan(0);
      }
    });
  });

  it('select options are strings', () => {
    ALL_CONFIG_FIELDS.forEach((field: any) => {
      if (field.type === 'select') {
        field.options.forEach((option: any) => {
          expect(typeof option).toBe('string');
        });
      }
    });
  });

  Object.keys(adminYaml).forEach((type) => {
    const config = (adminYaml as any)[type];

    describe(`${type}`, () => {
      it('has required top-level fields', () => {
        expect(typeof config.title).toBe('string');
        expect(typeof config.endpoint).toBe('string');
        expect(typeof config.getItemId).toBe('string');
        expect(Array.isArray(config.columns)).toBe(true);
        expect(Array.isArray(config.fields)).toBe(true);
      });

      it('getItemId is a valid key name', () => {
        expect(['slug', 'name', 'type']).toContain(config.getItemId);
      });

      it('columns have a field property', () => {
        config.columns.forEach((col: any) => {
          expect(typeof col.field).toBe('string');
        });
      });

      it('fields have name and valid type', () => {
        config.fields.forEach((field: any) => {
          expect(typeof field.name).toBe('string');
          if (field.type) {
            expect(VALID_FIELD_TYPES).toContain(field.type);
          }
        });
      });

      it('globalFields have valid type when present', () => {
        if (config.globalFields) {
          config.globalFields.forEach((field: any) => {
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
          expect(['calendar', 'linkMappings']).toContain(config.transforms);
        }
      });
    });
  });

  describe('create and delete capabilities', () => {
    const creatableTypes = ['store', 'events', 'links', 'forms', 'calendar'];
    const editOnlyTypes = ['link_mappings'];

    it('the five content pages are not edit-only', () => {
      creatableTypes.forEach((type) => {
        expect((adminYaml as any)[type].editOnly).toBeFalsy();
      });
    });

    it('link_mappings keeps edit-only behavior', () => {
      expect((adminYaml as any).link_mappings.editOnly).toBe(true);
    });

    it('every creatable page has a field for its id', () => {
      creatableTypes.forEach((type) => {
        const config = (adminYaml as any)[type];
        const idField = config.getItemId;
        const fieldNames = config.fields.map((f: any) => f.name);
        expect(fieldNames).toContain(idField);
      });
    });

    it('store and forms supply the documented page-level create defaults', () => {
      const store = (adminYaml as any).store;
      const forms = (adminYaml as any).forms;
      expect(store.createDefaults.defaultAmount).toBe(0);
      expect(forms.createDefaults.width).toBe(640);
      expect(forms.createDefaults.height).toBe(1000);
    });

    it('editOnly is either omitted or a boolean when present', () => {
      Object.values(adminYaml as any).forEach((config: any) => {
        if (config.editOnly !== undefined) {
          expect(typeof config.editOnly).toBe('boolean');
        }
      });
    });

    it('edit-only pages cannot also declare create defaults', () => {
      editOnlyTypes.forEach((type) => {
        expect((adminYaml as any)[type].createDefaults).toBeUndefined();
      });
    });

    it('createDefaults values are primitives, arrays, or maps', () => {
      Object.values(adminYaml as any).forEach((config: any) => {
        if (config.createDefaults) {
          Object.values(config.createDefaults).forEach((value: any) => {
            expect(['string', 'number', 'boolean', 'object']).toContain(typeof value);
          });
        }
      });
    });
  });
});
