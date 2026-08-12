import { describe, it, expect } from 'vitest';
import { dump, load } from 'js-yaml';
import homeInfo from '@content/home.yml';
import { TRANSFORM_MAPPINGS } from '@/utils/admin-config';

interface HomeSectionInput {
  source: string;
  title?: string;
  cardTitleField?: string;
  cardHrefPrefix?: string;
  cardHrefField?: string;
}

interface HomeSectionOutput {
  source: string;
  title?: string;
  card: {
    titleField?: string;
    hrefPrefix?: string;
    hrefField?: string;
  };
}

interface HomeGlobals {
  heroMarkdown: string;
  calendars: string[];
}

interface HomeData {
  hero: { markdown: string };
  sections: HomeSectionOutput[];
  calendars: string[];
}

const homeTransform = TRANSFORM_MAPPINGS.home as unknown as {
  initialDataTransform: (data: unknown) => HomeSectionInput[];
  initialGlobalsTransform: (data: unknown) => HomeGlobals;
  saveDataTransform: (items: HomeSectionInput[], globals: HomeGlobals) => HomeData;
};

describe('home transform roundtrip', () => {
  it('preserves data through transform and save', () => {
    const sections = homeTransform.initialDataTransform(homeInfo);
    const globals = homeTransform.initialGlobalsTransform(homeInfo);
    const saved = homeTransform.saveDataTransform(sections, globals);

    expect(saved).toEqual(homeInfo);
  });

  it('survives the YAML dump/load roundtrip keeping the file-shape valid', () => {
    const sections = homeTransform.initialDataTransform(homeInfo);
    const globals = homeTransform.initialGlobalsTransform(homeInfo);
    const saved = homeTransform.saveDataTransform(sections, globals);

    const loaded = load(dump(saved)) as HomeData;

    expect(typeof loaded.hero.markdown).toBe('string');
    expect(loaded.hero.markdown.length).toBeGreaterThan(0);

    expect(Array.isArray(loaded.sections)).toBe(true);
    loaded.sections.forEach((section: HomeSectionOutput) => {
      expect(['store', 'events', 'links']).toContain(section.source);
      if (section.title !== undefined) {
        expect(typeof section.title).toBe('string');
      }
      expect(section.card).toBeDefined();
      expect(['title', 'description']).toContain(section.card.titleField);
      expect(section.card.hrefField !== undefined || section.card.hrefPrefix !== undefined).toBe(true);
      if (section.card.hrefField !== undefined) {
        expect(section.card.hrefField).toBe('href');
      }
      if (section.card.hrefPrefix !== undefined) {
        expect(typeof section.card.hrefPrefix).toBe('string');
      }
    });

    expect(Array.isArray(loaded.calendars)).toBe(true);
    loaded.calendars.forEach((calendar: string) => {
      expect(typeof calendar).toBe('string');
    });
  });

  it('exposes hero markdown and calendar filters as globals', () => {
    const globals = homeTransform.initialGlobalsTransform(homeInfo);
    expect(globals.heroMarkdown).toBe(homeInfo.hero.markdown);
    expect(globals.calendars).toEqual(homeInfo.calendars);
  });

  it('transformed data is the sections array with flat card fields', () => {
    const sections = homeTransform.initialDataTransform(homeInfo);
    expect(Array.isArray(sections)).toBe(true);
    expect(sections[0].source).toBe('store');
    expect(sections[0].cardTitleField).toBe('description');
    expect(sections[0].cardHrefPrefix).toBe('/');
    expect('card' in sections[0]).toBe(false);
  });

  it('drops blank optional fields on save', () => {
    const sections: HomeSectionInput[] = [
      { source: 'store', title: '', cardTitleField: 'title', cardHrefPrefix: '', cardHrefField: '' },
    ];
    const saved = homeTransform.saveDataTransform(sections, { heroMarkdown: 'x', calendars: ['Training'] });

    expect(saved.sections[0]).toEqual({
      source: 'store',
      card: { titleField: 'title' },
    });
  });
});