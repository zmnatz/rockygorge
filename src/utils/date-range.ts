import type { DateRange } from '@/types/date-range';

/** Milliseconds in a day (UTC). */
export const DAY_MS = 24 * 60 * 60 * 1000;

/** The maximum inclusive day-count a queryable date range may span. */
export const MAX_RANGE_DAYS = 366;

/** Parse a YYYY-MM-DD string as a UTC date at midnight. */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** Whether a YYYY-MM-DD string is a real calendar date (rejects e.g. 2026-02-30). */
export function isValidDate(dateStr: string): boolean {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = parseDate(dateStr);
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** Number of days a date range spans (inclusive of both end dates). */
export function countDays(range: DateRange): number {
  const start = parseDate(range.start);
  const endExclusive = new Date(parseDate(range.end).getTime() + DAY_MS);
  return (endExclusive.getTime() - start.getTime()) / DAY_MS;
}
