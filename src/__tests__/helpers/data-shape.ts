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

export function validateDataArray<T extends object>(
  items: T[],
  config: DataArrayConfig
) {
  describe(`${config.label}`, () => {
    it('is an array', () => {
      expect(Array.isArray(items)).toBe(true);
    });

    it('each item has required fields', () => {
      items.forEach((item) => {
        const record = item as Record<string, unknown>;
        config.requiredFields.forEach(({ name, type, optional }) => {
          const value = record[name];
          if (optional) {
            if (value !== undefined) {
              expect(typeof value).toBe(type);
            }
          } else {
            expect(typeof value).toBe(type);
          }
        });
      });
    });

    it(`${config.idField}s are unique`, () => {
      const record = items as Array<Record<string, unknown>>;
      const ids = record.map((item) => item[config.idField]);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
}
