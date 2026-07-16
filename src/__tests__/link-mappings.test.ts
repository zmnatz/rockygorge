import { describe, it, expect } from 'vitest';
import linkMappings from '@/data/link_mappings.yml';

describe('link_mappings.yml', () => {
  it('has store mappings', () => {
    expect(linkMappings.store).toBeDefined();
    expect(linkMappings.store.mappings).toBeDefined();
    expect(linkMappings.store.default).toBe('View Item');
  });

  it('has forms mappings', () => {
    expect(linkMappings.forms).toBeDefined();
    expect(linkMappings.forms.mappings).toBeDefined();
    expect(linkMappings.forms.default).toBe('Fill out Form');
  });

  it('store has expected mapping keys', () => {
    const keys = Object.keys(linkMappings.store.mappings);
    expect(keys).toContain('Buy Tickets');
    expect(keys).toContain('Sponsor the Event');
    expect(keys).toContain('Make a Donation');
    expect(keys).toContain('Pay Dues');
    expect(keys).toContain('Buy Gear');
  });

  it('forms has expected mapping keys', () => {
    const keys = Object.keys(linkMappings.forms.mappings);
    expect(keys).toContain('Nominate Member');
    expect(keys).toContain('Submit Travel Info');
    expect(keys).toContain('Interest Form');
    expect(keys).toContain('RSVP');
  });
});

describe('linkMappings transform roundtrip', () => {
  function initialDataTransform(data: any) {
    return [
      {
        type: 'store',
        mappings: Object.entries(data.store?.mappings || {}).map(([name, value]) => ({ name, value })),
        default: data.store?.default,
      },
      {
        type: 'forms',
        mappings: Object.entries(data.forms?.mappings || {}).map(([name, value]) => ({ name, value })),
        default: data.forms?.default,
      },
    ];
  }

  function saveDataTransform(items: any[]) {
    const result: any = {};
    items.forEach((item: any) => {
      const mappings: any = {};
      (item.mappings || []).forEach((m: any) => {
        mappings[m.name] = m.value;
      });
      result[item.type] = {
        mappings,
        default: item.default,
      };
    });
    return result;
  }

  it('roundtrips through transform and save', () => {
    const transformed = initialDataTransform(linkMappings);
    const saved = saveDataTransform(transformed);

    expect(saved.store.mappings).toEqual(linkMappings.store.mappings);
    expect(saved.store.default).toEqual(linkMappings.store.default);
    expect(saved.forms.mappings).toEqual(linkMappings.forms.mappings);
    expect(saved.forms.default).toEqual(linkMappings.forms.default);
  });
});
