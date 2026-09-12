import { describe, it, expect } from 'vitest';
import dues from '@content/admin/dues.yaml';
import type { Dues } from '@/types/data';

function toDateString(value: Dues['date']): string {
  const raw: unknown = value;
  return raw instanceof Date ? raw.toISOString().slice(0, 10) : String(raw);
}

describe('dues.yaml', () => {
  it('holds one row per person', () => {
    const names = dues.map((entry) => entry.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('each row has a name and an ISO date', () => {
    dues.forEach((entry) => {
      expect(typeof entry.name).toBe('string');
      expect(toDateString(entry.date)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('monthly is a boolean when present', () => {
    dues.forEach((entry) => {
      if (entry.monthly !== undefined) {
        expect(typeof entry.monthly).toBe('boolean');
      }
    });
  });
});