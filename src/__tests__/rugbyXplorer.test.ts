import { describe, expect, it } from 'vitest';
import {
  clubPageCandidates,
  clubPageIsDue,
  crestEntityId,
  fixturesUrl,
  matchUrl,
  resolveClubPage,
} from '@/utils/rugbyXplorer';

describe('matchUrl', () => {
  it("links to the fixture's match report under the team's club", () => {
    expect(matchUrl('3c5fe054e0873dae1', 'rocky-gorge-rugby')).toBe(
      'https://xplorer.rugby/rocky-gorge-rugby/match-centre/3c5fe054e0873dae1?tab=Points-Summary',
    );
  });

  it('uses the union for a club with no known page, since the report loads under any entity', () => {
    expect(matchUrl('abc', null)).toBe(
      'https://xplorer.rugby/capitalrugby/match-centre/abc?tab=Points-Summary',
    );
  });
});

describe('fixturesUrl', () => {
  it("links to the club's fixtures and results", () => {
    expect(fixturesUrl('potomac-exiles')).toBe('https://xplorer.rugby/potomac-exiles/fixtures-results');
  });

  it("has no link for a club with no known page, so the page can't imply one", () => {
    expect(fixturesUrl(null)).toBeNull();
  });
});

describe('crestEntityId', () => {
  it('reads the club id from a CMS crest URL', () => {
    expect(crestEntityId('https://dpf0m541u9zk8.cloudfront.net/ru/team/91273.png?v=1712684240196')).toBe('91273');
  });

  it('has none for a crest stored elsewhere, or no crest', () => {
    expect(crestEntityId('https://d26phqdbpt0w91.cloudfront.net/NonVideo/d89f330c.png')).toBeNull();
    expect(crestEntityId('')).toBeNull();
  });
});

describe('clubPageCandidates', () => {
  it("tries the site's slug first, without its rx prefix, then slugs built from the name", () => {
    const candidates = clubPageCandidates('Riverlands', 'M', [
      { name: 'Riverlands Rugby', slug: 'rx-91268-prince-william-county-rugby' },
      { name: 'Elsewhere', slug: 'rx-1-elsewhere' },
    ], '91268');

    expect(candidates[0]).toBe('prince-william-county-rugby');
    expect(candidates).toContain('riverlands');
    expect(candidates).toContain('riverlands-rugby');
    expect(candidates).not.toContain('elsewhere');
  });

  it('tries women-specific slugs for a women\'s side', () => {
    expect(clubPageCandidates('Frederick', 'W', [], null)).toContain('frederick-rugby-women');
  });
});

describe('resolveClubPage crests', () => {
  it("ignores the CMS's generic placeholder as a club's crest", async () => {
    const lookup = async () => ({
      id: '5',
      name: 'Pax River',
      type: 'club',
      crest: 'https://d26phqdbpt0w91.cloudfront.net/NonVideo/d89f330c.png',
    });

    await expect(resolveClubPage(['x'], '5', 'Pax River', lookup)).resolves.toEqual({ slug: 'x', crest: null });
  });
});

describe('clubPageCandidates by name', () => {
  it("does not offer a men's page for a women's side, or the reverse", () => {
    const sites = [
      { name: 'Frederick Rugby Men', slug: 'rx-91252-frederick-rugby-men' },
      { name: 'Frederick Rugby Women', slug: 'rx-91253-frederick-rugby-women' },
    ];

    expect(clubPageCandidates('Frederick', 'W', sites, null)[0]).toBe('frederick-rugby-women');
    expect(clubPageCandidates('Frederick', 'W', sites, null)).not.toContain('frederick-rugby-men');
    expect(clubPageCandidates('Frederick', 'M', sites, null)[0]).toBe('frederick-rugby-men');
    expect(clubPageCandidates('Frederick', 'M', sites, null)).not.toContain('frederick-rugby-women');
  });
});

describe('resolveClubPage', () => {
  const CREST = 'https://dpf0m541u9zk8.cloudfront.net/ru/team/91267.png?v=1';
  const details = (id: string | null, name: string | null = 'Some Club') => ({ id, name, type: 'club', crest: CREST });

  it('accepts the first slug the CMS confirms has the crest id', async () => {
    const lookup = async (slug: string) => (slug === 'second' ? details('91267') : details('999'));

    await expect(resolveClubPage(['first', 'second', 'third'], '91267', 'Potomac Exiles', lookup)).resolves.toEqual({ slug: 'second', crest: CREST });
  });

  it('accepts nothing when no slug has the crest id, even with a matching name', async () => {
    const lookup = async () => details('999', 'Potomac Exiles');

    await expect(resolveClubPage(['potomac-exiles'], '91267', 'Potomac Exiles', lookup)).resolves.toBeNull();
  });

  it('with no crest id, accepts a club whose name matches once a generic word is dropped', async () => {
    const lookup = async () => details('5', 'Pax River Rugby');

    await expect(resolveClubPage(['pax-river-rugby'], null, 'Pax River', lookup)).resolves.toEqual({ slug: 'pax-river-rugby', crest: CREST });
  });

  it('with no crest id, does not accept a different club or a non-club', async () => {
    const other = async () => details('5', 'Pax River Youth Rugby');
    const union = async () => ({ id: '5', name: 'Pax River', type: 'geographical-union', crest: CREST });
    const missing = async () => details(null, null);

    await expect(resolveClubPage(['x'], null, 'Pax River', other)).resolves.toBeNull();
    await expect(resolveClubPage(['x'], null, 'Pax River', union)).resolves.toBeNull();
    await expect(resolveClubPage(['x'], null, 'Pax River', missing)).resolves.toBeNull();
  });
});

describe('clubPageIsDue', () => {
  const NOW = new Date('2026-11-10T06:00:00Z');
  const daysAgo = (days: number) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  it('looks up a club it has never seen', () => {
    expect(clubPageIsDue(undefined, NOW)).toBe(true);
  });

  it('keeps a confirmed page for a month', () => {
    expect(clubPageIsDue({ slug: 'nova', crest: null, checkedAt: daysAgo(29) }, NOW)).toBe(false);
    expect(clubPageIsDue({ slug: 'nova', crest: null, checkedAt: daysAgo(30) }, NOW)).toBe(true);
  });

  it('tries an unconfirmed club again after a week', () => {
    expect(clubPageIsDue({ slug: null, crest: null, checkedAt: daysAgo(6) }, NOW)).toBe(false);
    expect(clubPageIsDue({ slug: null, crest: null, checkedAt: daysAgo(7) }, NOW)).toBe(true);
  });

  it('looks up an entry with no check date', () => {
    expect(clubPageIsDue({ slug: 'nova', crest: null }, NOW)).toBe(true);
  });
});
