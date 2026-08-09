import { describe, it, expect } from 'vitest';
import events from '@content/events.yml';
import type { Event } from '@/types/data';
import { validateDataArray } from './helpers/data-shape';

validateDataArray<Event>(events, {
  label: 'events.yml',
  idField: 'slug',
  requiredFields: [
    { name: 'slug', type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'summary', type: 'string' },
    { name: 'title', type: 'string' },
    { name: 'organizers', type: 'object' },
    { name: 'hide', type: 'boolean', optional: true },
    { name: 'location', type: 'string', optional: true },
    { name: 'start', type: 'string', optional: true },
    { name: 'end', type: 'string', optional: true },
  ],
});

describe('events.yml', () => {
  it('has the open event', () => {
    const openEvent = events.find((e: Event) => e.slug === 'open');
    expect(openEvent).toBeDefined();
    expect(openEvent?.title).toContain('Rocky Gorge Open');
    expect(openEvent?.organizers.length).toBeGreaterThan(0);
  });
});
