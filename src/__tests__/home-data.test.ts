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

  it('each section has a card mapping', () => {
    home.sections.forEach((section) => {
      expect(section.card).toBeDefined();
      expect(['title', 'description']).toContain(section.card.titleField);
      expect(
        section.card.hrefField !== undefined ||
          section.card.hrefPrefix !== undefined
      ).toBe(true);
      if (section.card.hrefField !== undefined) {
        expect(section.card.hrefField).toBe('href');
      }
      if (section.card.hrefPrefix !== undefined) {
        expect(typeof section.card.hrefPrefix).toBe('string');
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
