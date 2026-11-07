import { describe, expect, it } from 'vitest';
import { resolveTeamCrest } from '@/utils/crest';

const PLACEHOLDER = 'https://d26phqdbpt0w91.cloudfront.net/NonVideo/d89f330c.png';
const REAL = 'https://dpf0m541u9zk8.cloudfront.net/ru/team/91269.png?v=1';
const WOMEN = 'https://dpf0m541u9zk8.cloudfront.net/ru/team/91263.png?v=1';
const clubs = {
  Raleigh: { slug: 'raleigh-rugby', crest: REAL },
  'NOVA Women': { slug: 'nova-women', crest: WOMEN },
  Loudoun: { slug: 'loudoun-rugby', crest: null },
};

describe('resolveTeamCrest', () => {
  it("swaps a fixture's placeholder for the club's crest, by the side's club", () => {
    expect(resolveTeamCrest(PLACEHOLDER, 'Raleigh MD2', clubs)).toBe(REAL);
  });

  it("keeps men's and women's clubs apart", () => {
    expect(resolveTeamCrest(PLACEHOLDER, 'NOVA WD3', clubs)).toBe(WOMEN);
    expect(resolveTeamCrest(PLACEHOLDER, 'NOVA MD3', clubs)).toBe(PLACEHOLDER);
  });

  it('fills in a side with no crest at all', () => {
    expect(resolveTeamCrest('', 'Raleigh MD3', clubs)).toBe(REAL);
  });

  it("keeps a side's own real crest", () => {
    expect(resolveTeamCrest(WOMEN, 'Raleigh MD2', clubs)).toBe(WOMEN);
  });

  it('leaves the placeholder when the club has no crest, or the name is no side', () => {
    expect(resolveTeamCrest(PLACEHOLDER, 'Loudoun MD3', clubs)).toBe(PLACEHOLDER);
    expect(resolveTeamCrest(PLACEHOLDER, 'Unknown MD3', clubs)).toBe(PLACEHOLDER);
    expect(resolveTeamCrest(PLACEHOLDER, 'Rocky Gorge', clubs)).toBe(PLACEHOLDER);
    expect(resolveTeamCrest(PLACEHOLDER, undefined, clubs)).toBe(PLACEHOLDER);
  });
});
