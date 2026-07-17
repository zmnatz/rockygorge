import { describe, it, expect } from 'vitest';
import calendarInfo from '@/data/calendar.yml';

function initialDataTransform(data: any) {
  return data.filters;
}

function initialGlobalsTransform(data: any) {
  return { months: data.months };
}

function saveDataTransform(items: any[], globals: any) {
  return {
    months: globals.months,
    filters: items,
  };
}

describe('calendar transform roundtrip', () => {
  it('preserves data through transform and save', () => {
    const transformed = initialDataTransform(calendarInfo);
    const globals = initialGlobalsTransform(calendarInfo);
    const saved = saveDataTransform(transformed, globals);

    expect(saved).toEqual(calendarInfo);
  });

  it('globals contain months', () => {
    const globals = initialGlobalsTransform(calendarInfo);
    expect(globals.months).toBe(calendarInfo.months);
  });

  it('transformed data is the filters array', () => {
    const transformed = initialDataTransform(calendarInfo);
    expect(transformed).toEqual(calendarInfo.filters);
    expect(Array.isArray(transformed)).toBe(true);
  });

  it('roundtrip preserves filter structure', () => {
    const transformed = initialDataTransform(calendarInfo);
    const globals = initialGlobalsTransform(calendarInfo);
    const saved = saveDataTransform(transformed, globals);

    saved.filters.forEach((filter: any, i: number) => {
      expect(filter.name).toBe(calendarInfo.filters[i].name);
      if (calendarInfo.filters[i].matches) {
        expect(filter.matches).toBe(calendarInfo.filters[i].matches);
      }
      if (calendarInfo.filters[i].notMatches) {
        expect(filter.notMatches).toBe(calendarInfo.filters[i].notMatches);
      }
      if (calendarInfo.filters[i].limit !== undefined) {
        expect(filter.limit).toBe(calendarInfo.filters[i].limit);
      }
    });
  });
});
