import { describe, it, expect } from 'vitest';
import events from '@/data/events.yml';
import { Event } from '@/types/data';

describe('events.yml', () => {
  it('is an array', () => {
    expect(Array.isArray(events)).toBe(true);
  });

  it('each event has required fields', () => {
    events.forEach((event: Event) => {
      expect(event.name).toBeDefined();
      expect(typeof event.name).toBe('string');
      expect(event.description).toBeDefined();
      expect(typeof event.description).toBe('string');
      expect(event.info).toBeDefined();
      expect(typeof event.info).toBe('string');
      expect(event.title).toBeDefined();
      expect(typeof event.title).toBe('string');
      expect(Array.isArray(event.organizers)).toBe(true);
    });
  });

  it('event names are unique', () => {
    const names = events.map((e: Event) => e.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('has the open event', () => {
    const openEvent = events.find((e: Event) => e.name === 'open');
    expect(openEvent).toBeDefined();
    expect(openEvent!.title).toContain('Rocky Gorge Open');
    expect(openEvent!.organizers.length).toBeGreaterThan(0);
  });
});
