import { describe, it, expect } from 'vitest';
import { formatItemSlugTag, parseItemSlugTag } from '@/utils/item-slug-tag';

describe('item slug tag', () => {
  it('round-trips a slug appended to a title', () => {
    const tagged = `Banquet Tickets${formatItemSlugTag('banquet')}`;
    expect(parseItemSlugTag(tagged)).toEqual({ itemSlug: 'banquet', itemTitle: 'Banquet Tickets' });
  });

  it('returns an empty slug for a title with no tag', () => {
    expect(parseItemSlugTag('Banquet Tickets')).toEqual({ itemSlug: '', itemTitle: 'Banquet Tickets' });
  });

  it('does not read an unprefixed bracketed suffix as a slug', () => {
    expect(parseItemSlugTag('Banquet Tickets [2-day]')).toEqual({ itemSlug: '', itemTitle: 'Banquet Tickets [2-day]' });
  });

  it('only recognises a tag at the end of the title', () => {
    expect(parseItemSlugTag('[item:banquet] Tickets')).toEqual({ itemSlug: '', itemTitle: '[item:banquet] Tickets' });
  });
});
