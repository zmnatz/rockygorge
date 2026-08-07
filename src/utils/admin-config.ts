export type TransformKey = 'calendar' | 'linkMappings';

export const ITEM_ID_MAPPINGS: Record<string, (item: any) => string> = {
  slug: (item) => item.slug,
  name: (item) => item.name,
  type: (item) => item.type,
};

export const RENDER_MAPPINGS: Record<string, (item: any, field: string) => any> = {
  boolean: (item, field) => item[field] ? 'Yes' : 'No',
  calendarMatches: (item) => item.matches || item.notMatches || '-',
  default: (item, field) => item[field],
};

export const TRANSFORM_MAPPINGS: Record<TransformKey, {
  initialDataTransform: (data: any) => any[];
  initialGlobalsTransform: (data: any) => any;
  saveDataTransform: (items: any[], globals?: any) => any;
}> = {
  calendar: {
    initialDataTransform: (data) => data.filters,
    initialGlobalsTransform: (data) => ({ months: data.months }),
    saveDataTransform: (items, globals) => ({
      months: globals.months,
      filters: items,
    }),
  },
  linkMappings: {
    initialDataTransform: (data) => [
      {
        type: 'store',
        mappings: Object.entries(data.store?.mappings || {}).map(([name, value]) => ({ name, value })),
        default: data.store?.default
      },
      {
        type: 'forms',
        mappings: Object.entries(data.forms?.mappings || {}).map(([name, value]) => ({ name, value })),
        default: data.forms?.default
      },
    ],
    initialGlobalsTransform: () => ({}),
    saveDataTransform: (items) => {
      const result = {};
      items.forEach((item: any) => {
        const mappings = {};
        (item.mappings || []).forEach((m: any) => {
          mappings[m.name] = m.value;
        });
        result[item.type] = {
          mappings,
          default: item.default,
        };
      });
      return result;
    },
  },
};
