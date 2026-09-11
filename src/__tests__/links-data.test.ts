import { describe, it, expect } from 'vitest';
import links from '@content/links.yml';
import type { Link } from '@/types/data';
import { validateDataArray } from './helpers/data-shape';

validateDataArray<Link>(links, {
  label: 'links.yml',
  idField: 'slug',
  requiredFields: [
    { name: 'slug', type: 'string' },
    { name: 'href', type: 'string' },
    { name: 'title', type: 'string' },
    { name: 'summary', type: 'string' },
    { name: 'visibility', type: 'object' },
    { name: 'home', type: 'boolean' },
  ],
});

describe('links.yml', () => {
  it('has at least one header link', () => {
    const headerLinks = links.filter((l: Link) => l.visibility.header);
    expect(headerLinks.length).toBeGreaterThan(0);
  });

  it('declares all visibility booleans for every link', () => {
    for (const link of links) {
      expect(typeof link.visibility.header).toBe('boolean');
      expect(typeof link.visibility.menu).toBe('boolean');
      expect(typeof link.visibility.authRequired).toBe('boolean');
    }
  });
});