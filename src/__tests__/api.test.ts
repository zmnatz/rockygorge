import { describe, it, expect } from 'vitest';
import { formatEventTime, formatStartDate } from '@/components/CalendarCard/api';

describe('formatEventTime', () => {
  it('formats same-day time events', () => {
    const result = formatEventTime(
      '2026-07-15T10:00:00-04:00',
      '2026-07-15T12:00:00-04:00'
    );
    expect(result).toMatch(/Jul 15/);
    expect(result).toContain('10:00 AM');
    expect(result).toContain('12:00 PM');
  });

  it('formats multi-day time events', () => {
    const result = formatEventTime(
      '2026-07-15T10:00:00-04:00',
      '2026-07-16T14:00:00-04:00'
    );
    expect(result).toContain('Jul 15');
    expect(result).toContain('Jul 16');
  });

  it('formats same-day all-day events', () => {
    const result = formatEventTime('2026-07-15', '2026-07-16');
    expect(result).toBe('Wed, Jul 15');
  });

  it('formats multi-day all-day events', () => {
    const result = formatEventTime('2026-07-15', '2026-07-18');
    expect(result).toContain('Wed, Jul 15');
    expect(result).toContain('Fri, Jul 17');
  });

  it('returns original string for invalid dates', () => {
    const result = formatEventTime('not-a-date', 'also-not-a-date');
    expect(result).toBe('not-a-date');
  });
});

describe('formatStartDate', () => {
  it('formats a date-only string', () => {
    const result = formatStartDate('2026-07-15');
    expect(result).toBe('Wed, Jul 15');
  });

  it('formats a datetime string', () => {
    const result = formatStartDate('2026-07-15T14:30:00-04:00');
    expect(result).toContain('Wed, Jul 15');
    expect(result).toContain('2:30 PM');
  });

  it('returns original string for invalid date', () => {
    const result = formatStartDate('invalid');
    expect(result).toBe('invalid');
  });
});
