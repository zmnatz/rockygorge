import { describe, it, expect } from 'vitest';
import links from '@content/links.yml';
import { Link } from '@/types/data';
import { validateDataArray } from './helpers/data-shape';

validateDataArray<Link>(links, {
  label: 'links.yml',
  idField: 'slug',
  requiredFields: [
    { name: 'slug', type: 'string' },
    { name: 'href', type: 'string' },
    { name: 'title', type: 'string' },
    { name: 'summary', type: 'string' },
    { name: 'header', type: 'boolean' },
    { name: 'hide', type: 'boolean', optional: true },
  ],
});

describe('links.yml', () => {
  it('has at least one header link', () => {
    const headerLinks = links.filter((l: Link) => l.header);
    expect(headerLinks.length).toBeGreaterThan(0);
  });
});
