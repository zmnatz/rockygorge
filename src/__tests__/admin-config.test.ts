import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import adminYaml from '@/data/admin.yml';

const VALID_FIELD_TYPES = ['text', 'number', 'boolean', 'textarea', 'keyValueMap', 'textList', 'textKeyValueMap'];

describe('admin.yml', () => {
  it('is an object with at least one admin type', () => {
    expect(typeof adminYaml).toBe('object');
    expect(Object.keys(adminYaml).length).toBeGreaterThan(0);
  });

  Object.keys(adminYaml).forEach((type) => {
    const config = (adminYaml as any)[type];

    describe(`${type}`, () => {
      it('has required top-level fields', () => {
        expect(typeof config.title).toBe('string');
        expect(typeof config.endpoint).toBe('string');
        expect(typeof config.dataFilePath).toBe('string');
        expect(typeof config.getItemId).toBe('string');
        expect(Array.isArray(config.columns)).toBe(true);
        expect(Array.isArray(config.fields)).toBe(true);
      });

      it('dataFilePath points to an existing file', () => {
        const filePath = path.join(process.cwd(), config.dataFilePath);
        expect(fs.existsSync(filePath)).toBe(true);
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
});
