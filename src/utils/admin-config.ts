export type TransformKey = 'calendar' | 'linkMappings' | 'home';

export const ITEM_ID_MAPPINGS: Record<string, (item: Record<string, unknown>) => string> = {
  slug: (item) => String(item.slug || ''),
  name: (item) => String(item.name || ''),
  type: (item) => String(item.type || ''),
  source: (item) => String(item.source || ''),
};

export const RENDER_MAPPINGS: Record<string, (item: Record<string, unknown>, field: string) => React.ReactNode> = {
  boolean: (item, field) => item[field] ? 'Yes' : 'No',
  calendarMatches: (item) => String(item.matches || item.notMatches || '-'),
  default: (item, field) => String(item[field] ?? ''),
};

export const TRANSFORM_MAPPINGS: Record<TransformKey, {
  initialDataTransform: (data: unknown) => Record<string, unknown>[];
  initialGlobalsTransform: (data: unknown) => Record<string, unknown>;
  saveDataTransform: (items: Record<string, unknown>[], globals?: Record<string, unknown>) => unknown;
}> = {
  calendar: {
    initialDataTransform: (data: unknown) => (data as { filters?: Record<string, unknown>[] }).filters || [],
    initialGlobalsTransform: (data: unknown) => ({ months: (data as { months?: unknown }).months }),
    saveDataTransform: (items, globals) => ({
      months: globals?.months,
      filters: items,
    }),
  },
  linkMappings: {
    initialDataTransform: (data: unknown) => {
      const d = data as { store?: { mappings?: Record<string, unknown>; default?: unknown }; forms?: { mappings?: Record<string, unknown>; default?: unknown } };
      return [
        {
          type: 'store',
          mappings: Object.entries(d.store?.mappings || {}).map(([name, value]) => ({ name, value })),
          default: d.store?.default
        },
        {
          type: 'forms',
          mappings: Object.entries(d.forms?.mappings || {}).map(([name, value]) => ({ name, value })),
          default: d.forms?.default
        },
      ];
    },
    initialGlobalsTransform: () => ({}),
    saveDataTransform: (items) => {
      const result: Record<string, unknown> = {};
      items.forEach((item) => {
        const mappings: Record<string, unknown> = {};
        ((item.mappings as Array<{ name: string; value: unknown }>) || []).forEach((m) => {
          mappings[m.name] = m.value;
        });
        result[String(item.type)] = {
          mappings,
          default: item.default,
        };
      });
      return result;
    },
  },
  home: {
    initialDataTransform: (data: unknown) =>
      ((data as { sections?: Array<{ source?: unknown; title?: unknown; card?: { titleField?: unknown; hrefPrefix?: unknown; hrefField?: unknown } }> }).sections || []).map((section) => ({
        source: section.source,
        title: section.title,
        cardTitleField: section.card?.titleField,
        cardHrefPrefix: section.card?.hrefPrefix,
        cardHrefField: section.card?.hrefField,
      })),
    initialGlobalsTransform: (data: unknown) => ({
      heroMarkdown: (data as { hero?: { markdown?: unknown } }).hero?.markdown,
      calendars: (data as { calendars?: unknown }).calendars,
    }),
    saveDataTransform: (items, globals) => ({
      hero: { markdown: globals?.heroMarkdown },
      sections: (items || []).map((item) => ({
        source: item.source,
        ...(item.title ? { title: item.title } : {}),
        card: {
          ...(item.cardTitleField ? { titleField: item.cardTitleField } : {}),
          ...(item.cardHrefPrefix ? { hrefPrefix: item.cardHrefPrefix } : {}),
          ...(item.cardHrefField ? { hrefField: item.cardHrefField } : {}),
        },
      })),
      calendars: globals?.calendars,
    }),
  },
};
