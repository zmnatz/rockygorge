import { describe, it, expect } from 'vitest';
import { compareValues } from '@/utils/sort';

describe('compareValues', () => {
  it('orders numbers ascending', () => {
    expect(compareValues(2, 10, 'asc')).toBeLessThan(0);
    expect(compareValues(10, 2, 'asc')).toBeGreaterThan(0);
  });

  it('orders numbers descending', () => {
    expect(compareValues(10, 2, 'desc')).toBeLessThan(0);
  });

  it('orders strings ascending', () => {
    expect(compareValues('apple', 'zebra', 'asc')).toBeLessThan(0);
    expect(compareValues('zebra', 'apple', 'asc')).toBeGreaterThan(0);
  });

  it('returns 0 for equal values', () => {
    expect(compareValues('same', 'same', 'asc')).toBe(0);
    expect(compareValues(42, 42, 'desc')).toBe(0);
  });

  it('sorts undefined values last in both directions', () => {
    expect(compareValues(undefined, 'a', 'asc')).toBeGreaterThan(0);
    expect(compareValues('a', undefined, 'asc')).toBeLessThan(0);
    expect(compareValues(undefined, 'a', 'desc')).toBeGreaterThan(0);
  });
});
