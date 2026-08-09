import { describe, it, expect } from 'vitest';
import home from '@content/home.yml';

describe('home.yml', () => {
  it('has hero markdown', () => {
    expect(typeof home.hero.markdown).toBe('string');
    expect(home.hero.markdown.length).toBeGreaterThan(0);
  });

  it('has an ordered list of sections with valid sources', () => {
    expect(Array.isArray(home.sections)).toBe(true);
    home.sections.forEach((section) => {
      expect(['store', 'events', 'links']).toContain(section.source);
      if (section.title !== undefined) {
        expect(typeof section.title).toBe('string');
      }
    });
  });

  it('has a list of calendar filters', () => {
    expect(Array.isArray(home.calendars)).toBe(true);
    home.calendars.forEach((calendar) => {
      expect(typeof calendar).toBe('string');
    });
  });
});
