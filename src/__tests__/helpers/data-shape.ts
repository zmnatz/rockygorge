import { describe, it, expect } from 'vitest';

interface FieldCheck {
  name: string;
  type: string;
  optional?: boolean;
}

interface DataArrayConfig {
  label: string;
  idField: string;
  requiredFields: FieldCheck[];
}

export function validateDataArray<T extends Record<string, any>>(
  items: T[],
  config: DataArrayConfig
) {
  describe(`${config.label}`, () => {
    it('is an array', () => {
      expect(Array.isArray(items)).toBe(true);
    });

    it('each item has required fields', () => {
      items.forEach((item) => {
        config.requiredFields.forEach(({ name, type, optional }) => {
          if (optional) {
            if (item[name] !== undefined) {
              expect(typeof item[name]).toBe(type);
            }
          } else {
            expect(typeof item[name]).toBe(type);
          }
        });
      });
    });

    it(`${config.idField}s are unique`, () => {
      const ids = items.map((item) => item[config.idField]);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
}
