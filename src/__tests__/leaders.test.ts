import { describe, expect, it } from 'vitest';
import type { CapitalFixture } from '@/api/capital';
import { buildLeadersSnapshot, tallyLeaders, type LeaderMatch } from '@/utils/leaders';

function match(
  id: string,
  events: [type: string, comment: string][],
  overrides: Partial<LeaderMatch['fixture']> = {},
  lineup: { home?: string[]; away?: string[]; homeSubs?: string[] } = {}
): LeaderMatch {
  const side = (names: string[], isHome: boolean) => names.map((name) => ({ name, isHome }));
  return {
    fixture: {
      id,
      compId: 'd3',
      compName: 'Capital Men D3',
      season: '2025/2026',
      dateTime: '2025-10-18T17:00:00+00:00',
      homeTeam: { name: 'Rocky Gorge MD3' },
      awayTeam: { name: 'Roanoke MD3' },
      ...overrides,
    },
    commentary: events.map(([type, comment]) => ({ type, comment })),
    players: [
      ...side(lineup.home ?? ['Riley Lopez', 'Sam Kicker'], true),
      ...side(lineup.away ?? ['Alex Opponent'], false),
    ],
    substitutes: side(lineup.homeSubs ?? [], true),
  };
}

describe('tallyLeaders', () => {
  it('credits a try to the scorer and their team', () => {
    const [season] = tallyLeaders([match('m1', [['Try', 'Try - Riley Lopez']])]);
    expect(season.season).toBe('2025/2026');
    expect(season.divisions[0].compName).toBe('Capital Men D3');
    expect(season.divisions[0].players[0]).toMatchObject({
      name: 'Riley Lopez',
      team: 'Rocky Gorge MD3',
      tries: 1,
      points: 5,
    });
  });

  it('counts games from every match squad the player is named in, scoring or not', () => {
    const [season] = tallyLeaders([
      match('m1', [['Try', 'Try - Riley Lopez']], {}, { home: ['Riley Lopez'] }),
      match('m2', [], {}, { home: ['Riley Lopez'], homeSubs: ['Sam Kicker'] }),
      match('m3', [['Try', 'Try - Riley Lopez']], {}, { home: ['Riley Lopez', 'Riley Lopez'] }),
    ]);
    expect(season.divisions[0].players).toHaveLength(1);
    expect(season.divisions[0].players[0]).toMatchObject({ name: 'Riley Lopez', games: 3 });
  });

  it('tallies kicks made and attempted, scoring conversions 2 and goals 3', () => {
    const [season] = tallyLeaders([
      match('m1', [
        ['Conversion', 'Conversion - Sam Kicker'],
        ['Conversion', 'Conversion - Sam Kicker'],
        ['Conversion Unsuccessful', 'Conversion Unsuccessful - Sam Kicker'],
        ['Penalty Goal', 'Penalty Goal - Sam Kicker'],
        ['Penalty Goal Unsuccessful', 'Penalty Goal Unsuccessful - Sam Kicker'],
        ['Field Goal', 'Field Goal - Sam Kicker'],
      ]),
    ]);
    expect(season.divisions[0].players[0]).toMatchObject({
      name: 'Sam Kicker',
      tries: 0,
      conversions: 2,
      conversionAttempts: 3,
      penaltyGoals: 1,
      penaltyGoalAttempts: 2,
      dropGoals: 1,
      points: 2 * 2 + 3 + 3,
    });
  });

  it('keeps same-named players on different teams apart and matches names case-insensitively', () => {
    const [season] = tallyLeaders([
      match('m1', [['Try', 'Try - riley LOPEZ']]),
      match('m2', [['Try', 'Try - Riley Lopez']], {
        homeTeam: { name: 'Severn River MD3' },
        awayTeam: { name: 'Loudoun MD3' },
      }),
    ]);
    const lines = season.divisions[0].players.map((line) => [line.name, line.team, line.tries]);
    expect(lines).toEqual([
      ['Riley Lopez', 'Rocky Gorge MD3', 1],
      ['Riley Lopez', 'Severn River MD3', 1],
    ]);
  });

  it('counts scorers it cannot place in the lineup as unattributed rather than guessing', () => {
    const [season] = tallyLeaders([
      // Named on both sides of the same match: ambiguous.
      match('m1', [['Try', 'Try - Jo Smith']], {}, { home: ['Jo Smith'], away: ['Jo Smith'] }),
      // Not in either lineup.
      match('m2', [['Penalty Goal', 'Penalty Goal - Nobody Listed']]),
    ]);
    expect(season.divisions[0].players).toEqual([]);
    expect(season.divisions[0].unattributed).toBe(2);
  });

  it('never credits the CMS placeholder for hidden players', () => {
    // Players who opt out of publication appear as "Name Withheld"; several
    // different people share it, so it is not a player.
    const [season] = tallyLeaders([
      match('m1', [['Try', 'Try - Name Withheld']], {}, { home: ['Name Withheld', 'Riley Lopez'] }),
    ]);
    expect(season.divisions[0].players).toEqual([]);
    expect(season.divisions[0].unattributed).toBe(1);
  });

  it('ranks by points then tries, orders divisions D1 first and seasons newest first', () => {
    const d1 = { compId: 'd1', compName: 'MAC Men D1' };
    const seasons = tallyLeaders([
      match('old', [['Try', 'Try - Riley Lopez']], { season: '2024/2025' }),
      match('m1', [
        ['Try', 'Try - Riley Lopez'],
        ['Conversion', 'Conversion - Sam Kicker'],
        ['Penalty Goal', 'Penalty Goal - Sam Kicker'],
        ['Penalty Goal', 'Penalty Goal - Alex Opponent'],
      ]),
      match('m2', [['Try', 'Try - Alex Opponent']], d1),
    ]);
    expect(seasons.map((season) => season.season)).toEqual(['2025/2026', '2024/2025']);
    expect(seasons[0].divisions.map((division) => division.compName)).toEqual([
      'MAC Men D1',
      'Capital Men D3',
    ]);
    // Riley 5 (1 try) and Sam 5 (no tries): tries break the tie; Alex 3.
    expect(seasons[0].divisions[1].players.map((line) => line.name)).toEqual([
      'Riley Lopez',
      'Sam Kicker',
      'Alex Opponent',
    ]);
  });

  it('reports how many of a division’s games had scoring logged', () => {
    const [season] = tallyLeaders([
      match('m1', [['Try', 'Try - Riley Lopez']]),
      match('m2', [['Substitution - Tactical', 'Substitution - Tactical Off: Riley Lopez']]),
    ]);
    expect(season.divisions[0]).toMatchObject({ games: 2, gamesWithScoring: 1 });
  });
});

describe('buildLeadersSnapshot', () => {
  const now = new Date('2026-11-03T12:00:00Z');
  const fixture = (id: string, overrides: Partial<CapitalFixture> = {}): CapitalFixture => ({
    id,
    compId: 'd3',
    compName: 'Capital Men D3',
    season: '2026/2027',
    dateTime: '2026-10-03T17:00:00+00:00',
    round: 'Round 1',
    roundLabel: 'Round 1',
    status: '',
    sourceType: '2',
    homeTeam: { name: 'Rocky Gorge MD3', score: '20', crest: '' },
    awayTeam: { name: 'Roanoke MD3', score: '10', crest: '' },
    ...overrides,
  });
  // A match centre for a fixture in this suite's season.
  const centre = (id: string, events: [string, string][]) =>
    match(id, events, { season: '2026/2027' });
  const memoryCache = (entries: Record<string, LeaderMatch | null> = {}) => ({
    get: (id: string) => entries[id],
    set: (id: string, value: LeaderMatch | null) => {
      entries[id] = value;
    },
    entries,
  });

  it('fetches only played league games', async () => {
    const fetched: string[] = [];
    await buildLeadersSnapshot({
      fetchFixtures: async () => [
        fixture('played'),
        fixture('sevens', { compName: "MAC 7s - S'kill 7's" }),
        fixture('crossover', { compName: 'Capital Women D2-D1 Crossovers' }),
        fixture('unplayed', {
          dateTime: '2026-11-14T17:00:00+00:00',
          homeTeam: { name: 'A', score: '', crest: '' },
          awayTeam: { name: 'B', score: '', crest: '' },
        }),
      ],
      fetchMatch: async (item) => {
        fetched.push(item.id);
        return match(item.id, []);
      },
      cache: memoryCache(),
      now: () => now,
    });
    expect(fetched).toEqual(['played']);
  });

  it('reuses cached games older than a week and refetches recent ones', async () => {
    const cache = memoryCache({
      old: centre('old', [['Try', 'Try - Riley Lopez']]),
      recent: centre('recent', []),
    });
    const fetched: string[] = [];
    const snapshot = await buildLeadersSnapshot({
      fetchFixtures: async () => [
        fixture('old', { dateTime: '2026-10-03T17:00:00+00:00' }),
        // Five days ago: scorers may still be getting logged.
        fixture('recent', { dateTime: '2026-10-29T17:00:00+00:00' }),
        fixture('new', { dateTime: '2026-10-10T17:00:00+00:00' }),
      ],
      fetchMatch: async (item) => {
        fetched.push(item.id);
        return centre(item.id, [['Try', 'Try - Sam Kicker']]);
      },
      cache,
      now: () => now,
    });
    expect(fetched).toEqual(['recent', 'new']);
    expect(Object.keys(cache.entries).sort()).toEqual(['new', 'old', 'recent']);
    // 1 cached try for Riley + 2 fetched tries for Sam.
    const players = snapshot.seasons[0].divisions[0].players;
    expect(players.map((line) => [line.name, line.tries])).toEqual([
      ['Sam Kicker', 2],
      ['Riley Lopez', 1],
    ]);
  });

  it('counts every played game toward coverage, even when its match centre is missing', async () => {
    const snapshot = await buildLeadersSnapshot({
      fetchFixtures: async () => [fixture('ok'), fixture('no-centre'), fixture('throttled')],
      fetchMatch: async (item) => {
        if (item.id === 'throttled') throw new Error('HTTP 429');
        if (item.id === 'no-centre') return null;
        return centre(item.id, [['Try', 'Try - Riley Lopez']]);
      },
      cache: memoryCache(),
      now: () => now,
    });
    expect(snapshot.seasons[0].divisions[0]).toMatchObject({ games: 3, gamesWithScoring: 1 });
  });

  it('remembers settled games that have no match centre instead of refetching them', async () => {
    const cache = memoryCache({ 'known-empty': null });
    const fetched: string[] = [];
    const build = () =>
      buildLeadersSnapshot({
        fetchFixtures: async () => [fixture('known-empty'), fixture('newly-empty')],
        fetchMatch: async (item) => {
          fetched.push(item.id);
          return null;
        },
        cache,
        now: () => now,
      });
    await build();
    await build();
    expect(fetched).toEqual(['newly-empty']);
  });

  it('reports games it could not fetch so a throttled build can be rejected', async () => {
    const snapshot = await buildLeadersSnapshot({
      fetchFixtures: async () => [fixture('ok'), fixture('throttled')],
      fetchMatch: async (item) => {
        if (item.id === 'throttled') throw new Error('HTTP 429');
        return centre(item.id, [['Try', 'Try - Riley Lopez']]);
      },
      cache: memoryCache(),
      now: () => now,
    });
    expect(snapshot.attempted).toBe(2);
    expect(snapshot.failed).toBe(1);
    expect(snapshot.seasons[0].divisions[0].players[0].tries).toBe(1);
  });
});
