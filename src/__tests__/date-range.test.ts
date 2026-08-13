import { describe, it, expect } from 'vitest';
import { MAX_RANGE_DAYS, countDays, parseDate } from '@/utils/date-range';

describe('parseDate', () => {
  it('parses a YYYY-MM-DD string as UTC midnight', () => {
    expect(parseDate('2024-12-31').toISOString()).toBe('2024-12-31T00:00:00.000Z');
  });

  it('parses a single-digit month and day', () => {
    expect(parseDate('2024-03-05').toISOString()).toBe('2024-03-05T00:00:00.000Z');
  });
});

describe('countDays', () => {
  it('counts a single day as 1', () => {
    expect(countDays({ start: '2026-05-01', end: '2026-05-01' })).toBe(1);
  });

  it('counts inclusive days across a month boundary', () => {
    expect(countDays({ start: '2026-05-01', end: '2026-05-31' })).toBe(31);
  });

  it('counts a full leap year as 366 days', () => {
    expect(countDays({ start: '2024-01-01', end: '2024-12-31' })).toBe(MAX_RANGE_DAYS);
  });

  it('counts a range that overruns the maximum as 367 days', () => {
    expect(countDays({ start: '2024-01-01', end: '2025-01-01' })).toBe(MAX_RANGE_DAYS + 1);
  });
});
