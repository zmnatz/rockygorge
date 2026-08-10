import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import adminYaml from '@config/admin.yml';
import { createItemFromCalendar } from '@/utils/admin-items';
import { CalendarItemList } from '@/components/AdminPage/GenerateFromCalendarPanel';
import type { CalendarSourceItem } from '@/components/CalendarCard/types';

interface AdminYamlConfig {
  fields: Array<{ name: string; type?: string }>;
  createDefaults?: Record<string, unknown>;
  generateFromCalendar?: boolean;
}

const adminConfig = adminYaml as Record<string, AdminYamlConfig>;

function buildFields(type: string): Array<{ name: string; type?: string }> {
  return adminConfig[type].fields.map((f) => ({ name: f.name, type: f.type }));
}

const timedSource: CalendarSourceItem = {
  summary: 'Rocky Gorge Open',
  description: 'Annual golf outing and fundraiser.',
  location: 'Timbers at Troy',
  htmlLink: 'https://calendar.google.com/event/1',
  start: '2026-07-15T18:00:00-04:00',
  end: '2026-07-15T20:00:00-04:00',
};

const allDaySource: CalendarSourceItem = {
  summary: 'Tournament Weekend',
  description: 'Full weekend of matches.',
  location: 'Field B',
  htmlLink: 'https://calendar.google.com/event/2',
  start: '2026-07-18',
  end: '2026-07-19',
};

describe('createItemFromCalendar', () => {
  it('pre-fills derivable fields from a timed calendar item', () => {
    const item = createItemFromCalendar(timedSource, buildFields('events'));

    expect(item.title).toBe('Rocky Gorge Open');
    expect(item.description).toBe('Annual golf outing and fundraiser.');
    expect(item.slug).toBe('rocky-gorge-open');
    expect(item.location).toBe('Timbers at Troy');
    expect(item.start).toBe('2026-07-15T18:00:00-04:00');
    expect(item.end).toBe('2026-07-15T20:00:00-04:00');
  });

  it('keeps date-only text for all-day items', () => {
    const item = createItemFromCalendar(allDaySource, buildFields('events'));

    expect(item.start).toBe('2026-07-18');
    expect(item.end).toBe('2026-07-19');
  });

  it('defaults the generated draft to hidden', () => {
    const item = createItemFromCalendar(timedSource, buildFields('events'));

    expect(item.hide).toBe(true);
  });

  it('derives the slug from the title via slugify', () => {
    const item = createItemFromCalendar(
      { ...timedSource, summary: '  Hello, World! 2024  ' },
      buildFields('events')
    );

    expect(item.slug).toBe('hello-world-2024');
  });

  it('starts description blank when the calendar item has none', () => {
    const { description, ...source } = timedSource;
    const item = createItemFromCalendar(source, buildFields('events'));

    expect(item.description).toBe('');
  });

  it('leaves store-only fields empty for store drafts', () => {
    const config = adminConfig.store;
    const item = createItemFromCalendar(
      timedSource,
      buildFields('store'),
      config.createDefaults || {}
    );

    expect(item.summary).toBe('');
    expect(item.defaultAmount).toBe(0);
    expect(item.options).toEqual([]);
    expect(item.supporters).toEqual([]);
    expect(item.subscriptions).toBeUndefined();
  });

  it('produces an independent draft each time', () => {
    const a = createItemFromCalendar(timedSource, buildFields('events'));
    const b = createItemFromCalendar(timedSource, buildFields('events'));

    expect(a).not.toBe(b);
    expect(a.slug).toBe('rocky-gorge-open');
    a.slug = 'edited';
    expect(b.slug).toBe('rocky-gorge-open');
  });
});

describe('CalendarItemList', () => {
  it('lists each item with its title and formatted start date', () => {
    const html = renderToStaticMarkup(
      <CalendarItemList items={[timedSource, allDaySource]} onSelect={() => {}} />
    );

    expect(html).toContain('Rocky Gorge Open');
    expect(html).toContain('Wed, Jul 15');
    expect(html).toContain('Tournament Weekend');
    expect(html).toContain('Sat, Jul 18');
  });
});

describe('generate-from-calendar admin config', () => {
  it('enables the calendar generation panel on the events admin', () => {
    expect(adminConfig.events.generateFromCalendar).toBe(true);
  });

  it('enables the calendar generation panel on the store admin', () => {
    expect(adminConfig.store.generateFromCalendar).toBe(true);
  });
});
