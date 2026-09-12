import { describe, it, expect } from 'vitest';
import { showOnHome } from '@/utils/sections';

describe('showOnHome', () => {
  const items = [
    { slug: 'dues', home: true },
    { slug: 'banquet', home: false },
    { slug: 'contacts' },
  ];

  it('keeps only items flagged home: true', () => {
    expect(showOnHome(items)).toEqual([{ slug: 'dues', home: true }]);
  });

  it('returns an empty array when nothing is shown on the home page', () => {
    expect(showOnHome([{ slug: 'banquet', home: false }])).toEqual([]);
  });

  it('treats absent home as off by default', () => {
    expect(showOnHome([{ slug: 'contacts' }, { slug: 'dues', home: true }])).toHaveLength(1);
  });
});