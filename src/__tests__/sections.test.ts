import { describe, it, expect } from 'vitest';
import { toSectionCard } from '@/utils/sections';

describe('toSectionCard', () => {
  it('builds a card from titleField and hrefPrefix', () => {
    const card = toSectionCard(
      { slug: 'dues', title: 'Pay your dues. Play rugby.', description: 'Fall Dues', summary: 'Fall Season: $200' },
      { titleField: 'description', hrefPrefix: '/' }
    );
    expect(card).toEqual({
      key: 'dues',
      title: 'Fall Dues',
      href: '/dues',
      summary: 'Fall Season: $200',
    });
  });

  it('builds a slug-based href with a multi-segment prefix', () => {
    const card = toSectionCard(
      { slug: 'open', title: '2026 Rocky Gorge Open', summary: 'Sign up or sponsor a hole.' },
      { titleField: 'title', hrefPrefix: '/events/' }
    );
    expect(card.href).toBe('/events/open');
    expect(card.key).toBe('open');
  });

  it('reads the href directly when hrefField is set', () => {
    const card = toSectionCard(
      { slug: 'contacts', href: '/contacts', title: 'Contacts', summary: 'club contacts' },
      { titleField: 'title', hrefField: 'href' }
    );
    expect(card).toEqual({
      key: '/contacts',
      title: 'Contacts',
      href: '/contacts',
      summary: 'club contacts',
    });
  });
});
