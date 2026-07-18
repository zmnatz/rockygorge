import { describe, it, expect } from 'vitest';
import { CalendarEvent, CalendarFilter } from '@/components/CalendarCard/types';
import { filterEvents } from '@/utils/calendar';

const mockEvents: CalendarEvent[] = [
  { summary: 'Rugby Practice', location: 'Field A', htmlLink: '', start: '2026-07-15T18:00:00', end: '2026-07-15T20:00:00' },
  { summary: 'Rugby Game vs DC', location: 'Field B', htmlLink: '', start: '2026-07-16T14:00:00', end: '2026-07-16T16:00:00' },
  { summary: 'Team Meeting', location: 'Room 101', htmlLink: '', start: '2026-07-17T19:00:00', end: '2026-07-17T20:00:00' },
  { summary: 'Social Event', location: 'Bar', htmlLink: '', start: '2026-07-18T20:00:00', end: '2026-07-18T22:00:00' },
];

describe('filterEvents', () => {
  it('filters events by matches regex', () => {
    const result = filterEvents(mockEvents, { name: 'test', matches: 'rugby' });
    expect(result).toHaveLength(2);
    expect(result[0].summary).toBe('Rugby Practice');
    expect(result[1].summary).toBe('Rugby Game vs DC');
  });

  it('filters events by notMatches regex', () => {
    const result = filterEvents(mockEvents, { name: 'test', notMatches: 'rugby' });
    expect(result).toHaveLength(2);
    expect(result[0].summary).toBe('Team Meeting');
    expect(result[1].summary).toBe('Social Event');
  });

  it('limits number of results', () => {
    const result = filterEvents(mockEvents, { name: 'test', limit: 2 });
    expect(result).toHaveLength(2);
  });

  it('hides summary when hideSummary is true', () => {
    const result = filterEvents(mockEvents, { name: 'test', hideSummary: true });
    result.forEach(event => {
      expect(event.summary).toBe('');
    });
  });

  it('returns all events when no criteria specified', () => {
    const result = filterEvents(mockEvents, { name: 'test' });
    expect(result).toHaveLength(4);
  });

  it('combines matches and limit', () => {
    const result = filterEvents(mockEvents, { name: 'test', matches: 'rugby', limit: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].summary).toBe('Rugby Practice');
  });
});
