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

  it('only recognises a tag at the end of the title', () => {
    expect(parseItemSlugTag('[banquet] Tickets')).toEqual({ itemSlug: '', itemTitle: '[banquet] Tickets' });
  });
});
