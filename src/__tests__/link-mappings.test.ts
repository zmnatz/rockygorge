import { describe, it, expect } from 'vitest';
import linkMappings from '@config/link_mappings.yml';
import { TRANSFORM_MAPPINGS } from '@/utils/admin-config';

interface LinkMappingsConfig {
  store: { mappings: Record<string, string>; default: string };
  forms: { mappings: Record<string, string>; default: string };
}

interface TransformItem {
  type: 'store' | 'forms';
  mappings: Array<{ name: string; value: string }>;
  default: string;
}

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
  const linkMappingsTransform = TRANSFORM_MAPPINGS.linkMappings as unknown as {
    initialDataTransform: (data: LinkMappingsConfig) => TransformItem[];
    saveDataTransform: (items: TransformItem[]) => LinkMappingsConfig;
  };

  it('roundtrips through transform and save', () => {
    const transformed = linkMappingsTransform.initialDataTransform(linkMappings as LinkMappingsConfig);
    const saved = linkMappingsTransform.saveDataTransform(transformed);

    expect(saved.store.mappings).toEqual(linkMappings.store.mappings);
    expect(saved.store.default).toEqual(linkMappings.store.default);
    expect(saved.forms.mappings).toEqual(linkMappings.forms.mappings);
    expect(saved.forms.default).toEqual(linkMappings.forms.default);
  });
});