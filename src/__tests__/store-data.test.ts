import { describe, it, expect } from 'vitest';
import store from '@/data/store.yml';
import { Product } from '@/types/data';
import { validateDataArray } from './helpers/data-shape';

validateDataArray<Product>(store, {
  label: 'store.yml',
  idField: 'slug',
  requiredFields: [
    { name: 'slug', type: 'string' },
    { name: 'defaultAmount', type: 'number' },
    { name: 'description', type: 'string' },
    { name: 'summary', type: 'string' },
    { name: 'title', type: 'string' },
    { name: 'options', type: 'object' },
    { name: 'hide', type: 'boolean', optional: true },
  ],
});

describe('store.yml', () => {
  it('each item has numeric option values', () => {
    store.forEach((item: Product) => {
      item.options.forEach((opt) => {
        expect(typeof opt.name).toBe('string');
        expect(typeof opt.value).toBe('number');
      });
    });
  });

  it('subscriptions have required fields when present', () => {
    store.forEach((item: Product) => {
      if (item.subscriptions) {
        item.subscriptions.forEach((sub) => {
          expect(typeof sub.name).toBe('string');
          expect(typeof sub.id).toBe('string');
          expect(typeof sub.description).toBe('string');
          expect(Array.isArray(sub.options)).toBe(true);
          sub.options.forEach((opt) => {
            expect(typeof opt.label).toBe('string');
            expect(typeof opt.value).toBe('string');
          });
        });
      }
    });
  });

  it('supporters is an array of strings when present', () => {
    store.forEach((item: Product) => {
      if (item.supporters) {
        expect(Array.isArray(item.supporters)).toBe(true);
        item.supporters.forEach((s) => {
          expect(typeof s).toBe('string');
        });
      }
    });
  });
});
