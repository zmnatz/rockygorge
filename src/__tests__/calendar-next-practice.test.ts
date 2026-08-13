import { describe, it, expect } from 'vitest';
import type { CalendarFilter, CalendarSourceItem } from '@/components/CalendarCard/types';
import { findNextPractice } from '@/utils/calendar';

const trainingFilter: CalendarFilter = { name: 'Training', matches: 'practice|training|wrestling' };

const items: CalendarSourceItem[] = [
  { summary: 'Rugby Practice', location: 'Field A', htmlLink: '', start: '2026-07-15T18:00:00', end: '2026-07-15T20:00:00' },
  { summary: 'Wrestling Training', location: 'Gym', htmlLink: '', start: '2026-07-17T18:00:00', end: '2026-07-17T20:00:00' },
  { summary: 'Team Meeting', location: 'Room 101', htmlLink: '', start: '2026-07-16T19:00:00', end: '2026-07-16T20:00:00' },
];

const now = (date: string) => new Date(date);

describe('findNextPractice', () => {
  it('returns the earliest practice at or after now', () => {
    const result = findNextPractice(items, [trainingFilter], now('2026-07-15T17:00:00'));
    expect(result?.summary).toBe('Rugby Practice');
  });

  it('ignores non-practice calendar items', () => {
    const result = findNextPractice(items, [trainingFilter], now('2026-07-16T12:00:00'));
    expect(result?.summary).toBe('Wrestling Training');
  });

  it('returns undefined when no practice is scheduled', () => {
    const result = findNextPractice(items, [trainingFilter], now('2026-07-18T12:00:00'));
    expect(result).toBeUndefined();
  });

  it('returns undefined when no training filter is defined', () => {
    const result = findNextPractice(items, [], now('2026-07-15T17:00:00'));
    expect(result).toBeUndefined();
  });
});
