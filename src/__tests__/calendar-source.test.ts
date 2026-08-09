import { describe, it, expect } from 'vitest';
import { CalendarSourceItem } from '@/components/CalendarCard/types';
import { mapCalendarSourceItem, mapCalendarSourceItems } from '@/utils/calendar';

const timedItem = {
  summary: 'Rugby Practice',
  description: 'Weekly contact session, cleats required.',
  location: 'Field A',
  htmlLink: 'https://calendar.google.com/event/1',
  start: { dateTime: '2026-07-15T18:00:00-04:00' },
  end: { dateTime: '2026-07-15T20:00:00-04:00' },
};

const allDayItem = {
  summary: 'Tournament Weekend',
  description: 'Full weekend of matches.',
  location: 'Field B',
  htmlLink: 'https://calendar.google.com/event/2',
  start: { date: '2026-07-18' },
  end: { date: '2026-07-19' },
};

describe('mapCalendarSourceItem', () => {
  it('maps a timed item with full source shape including description', () => {
    const result: CalendarSourceItem = mapCalendarSourceItem(timedItem);

    expect(result.summary).toBe('Rugby Practice');
    expect(result.description).toBe('Weekly contact session, cleats required.');
    expect(result.location).toBe('Field A');
    expect(result.htmlLink).toBe('https://calendar.google.com/event/1');
    expect(result.start).toBe('2026-07-15T18:00:00-04:00');
    expect(result.end).toBe('2026-07-15T20:00:00-04:00');
  });

  it('maps an all-day item from date-only values', () => {
    const result: CalendarSourceItem = mapCalendarSourceItem(allDayItem);

    expect(result.start).toBe('2026-07-18');
    expect(result.end).toBe('2026-07-19');
    expect(result.description).toBe('Full weekend of matches.');
  });

  it('leaves description undefined when the source has none', () => {
    const { description, ...withoutDescription } = timedItem;
    const result: CalendarSourceItem = mapCalendarSourceItem(withoutDescription);

    expect(result.description).toBeUndefined();
  });
});

describe('mapCalendarSourceItems', () => {
  it('returns every upcoming item unfiltered, preserving source order', () => {
    const result = mapCalendarSourceItems([timedItem, allDayItem]);

    expect(result).toHaveLength(2);
    expect(result[0].summary).toBe('Rugby Practice');
    expect(result[1].summary).toBe('Tournament Weekend');
  });

  it('returns an empty list for an empty feed', () => {
    expect(mapCalendarSourceItems([])).toEqual([]);
  });
});