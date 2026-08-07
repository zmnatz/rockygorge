import { describe, it, expect } from 'vitest';
import calendarInfo from '@content/calendar.yml';

describe('calendar.yml', () => {
  it('has a positive months value', () => {
    expect(typeof calendarInfo.months).toBe('number');
    expect(calendarInfo.months).toBeGreaterThan(0);
  });

  it('has a filters array', () => {
    expect(Array.isArray(calendarInfo.filters)).toBe(true);
    expect(calendarInfo.filters.length).toBeGreaterThan(0);
  });

  it('each filter has a name', () => {
    calendarInfo.filters.forEach((filter) => {
      expect(typeof filter.name).toBe('string');
      expect(filter.name.length).toBeGreaterThan(0);
    });
  });

  it('matches patterns are valid regex', () => {
    calendarInfo.filters.forEach((filter) => {
      if (filter.matches) {
        expect(() => new RegExp(filter.matches)).not.toThrow();
      }
    });
  });

  it('notMatches patterns are valid regex', () => {
    calendarInfo.filters.forEach((filter) => {
      if (filter.notMatches) {
        expect(() => new RegExp(filter.notMatches)).not.toThrow();
      }
    });
  });

  it('limit is a positive number when present', () => {
    calendarInfo.filters.forEach((filter) => {
      if (filter.limit !== undefined) {
        expect(typeof filter.limit).toBe('number');
        expect(filter.limit).toBeGreaterThan(0);
      }
    });
  });

  it('hideSummary is boolean when present', () => {
    calendarInfo.filters.forEach((filter) => {
      if (filter.hideSummary !== undefined) {
        expect(typeof filter.hideSummary).toBe('boolean');
      }
    });
  });

  it('filter names are unique', () => {
    const names = calendarInfo.filters.map((f) => f.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
