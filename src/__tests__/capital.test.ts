import { describe, expect, it } from 'vitest';
import {
  ALL,
  backfillCrests,
  compareCompNames,
  compsOf,
  defaultSeason,
  divisionRank,
  filterFixtures,
  findTeamIdentity,
  groupFixturesByDate,
  isOneOffComp,
  isLeagueComp,
  isResult,
  isSevensComp,
  buildStandingsSnapshot,
  isPastPage,
  leagueClubIds,
  mergeLeagueFeeds,
  seasonSnapshotFile,
  splitStandingsSnapshot,
  ladderKeyFor,
  ladderKeysOf,
  ladderSnapshotKey,
  mergeFixtures,
  parseTeamIdentity,
  resultsOf,
  seasonsOf,
  teamIdentities,
  teamsOf,
  upcomingOf,
  type CapitalFixture,
} from '@/api/capital';

function fixture(
  id: string,
  overrides: Partial<CapitalFixture> = {}
): CapitalFixture {
  return {
    id,
    compId: 'comp-d3',
    compName: 'Capital Men D3',
    season: '2025/2026',
    dateTime: '2026-03-01T17:00:00+00:00',
    round: 'Round 1',
    roundLabel: '',
    status: 'Result',
    sourceType: '2',
    homeTeam: { name: 'Rocky Gorge MD3', score: '20', crest: '' },
    awayTeam: { name: 'Virginia MD3', score: '10', crest: '' },
    ...overrides,
  };
}

describe('parseTeamIdentity', () => {
  it('merges renames of the same side across seasons', () => {
    expect(parseTeamIdentity('Rocky Gorge MD3', 'Capital Men D3')).toEqual(
      parseTeamIdentity('Rocky Gorge D3', 'Capital D3 Challenger Men')
    );
    expect(parseTeamIdentity('Rocky Gorge MD3', 'Capital Men D3').display).toBe(
      'Rocky Gorge MD3'
    );
  });

  it('merges 1st XV naming with divisional naming', () => {
    expect(parseTeamIdentity('Pittsburgh Harlequins 1st XV', 'MAC D1 Men')).toEqual(
      parseTeamIdentity('Pittsburgh Harlequins D1', 'MAC D1 Men')
    );
  });

  it('keeps divisions, genders and distinct clubs apart', () => {
    const md3 = parseTeamIdentity('Rocky Gorge MD3', 'Capital Men D3');
    expect(parseTeamIdentity('Rocky Gorge MD1', 'MAC Men D1').key).not.toBe(md3.key);
    expect(parseTeamIdentity('Roanoke WD3', 'Capital Women D3').key).not.toBe(md3.key);
    expect(parseTeamIdentity('Washington Renegades MD3', 'Capital Men D3').key).not.toBe(
      parseTeamIdentity('Washington MD3', 'Capital Men D3').key
    );
    expect(parseTeamIdentity('NOVA Men D3', 'Capital Men D3')).toEqual(
      parseTeamIdentity('NOVA MD3', 'Capital Men D3')
    );
  });
});

describe('teamIdentities', () => {
  it('groups season-specific names under one stable identity', () => {
    const fixtures = [
      fixture('1', {
        season: '2025/2026',
        homeTeam: { name: 'Rocky Gorge MD3', score: '20', crest: '' },
        awayTeam: { name: 'NOVA MD3', score: '10', crest: '' },
      }),
      fixture('2', {
        season: '2024/2025',
        compId: 'old',
        compName: 'Capital Men D3 Challenger',
        homeTeam: { name: 'Rocky Gorge D3', score: '30', crest: '' },
        awayTeam: { name: 'NOVA Men D3', score: '5', crest: '' },
      }),
    ];
    const identities = teamIdentities(fixtures, ALL, ALL);
    const gorge = identities.find((identity) => identity.display === 'Rocky Gorge MD3');
    expect(gorge?.names).toEqual(['Rocky Gorge D3', 'Rocky Gorge MD3']);
    expect(findTeamIdentity(identities, 'Rocky Gorge D3')).toBe(gorge);
  });
});

describe('isOneOffComp', () => {
  it('detects crossover and extra competitions in any naming style', () => {
    expect(isOneOffComp('Capital Men Extra Competition')).toBe(true);
    expect(isOneOffComp("Capital Women's Crossovers")).toBe(true);
    expect(isOneOffComp('Capital Women’s Crossovers')).toBe(true);
    expect(isOneOffComp('Capital Men Extra D1 D2 Crossover')).toBe(true);
    expect(isOneOffComp('Capital Women D2-D1 Crossovers')).toBe(true);
  });

  it('keeps regular divisions and championship rounds', () => {
    expect(isOneOffComp('Capital Women D2')).toBe(false);
    expect(isOneOffComp('Capital Men D3 Playoffs')).toBe(false);
    expect(isOneOffComp('ASR Semifinals - Capital and Empire')).toBe(false);
    expect(isOneOffComp('2025 National Championships')).toBe(false);
    expect(isOneOffComp('2025 Super Regional Atlantic')).toBe(false);
    expect(isOneOffComp('')).toBe(false);
  });
});

describe('isLeagueComp', () => {
  it('excludes sevens, crossovers and extra competitions from the league board', () => {
    expect(isLeagueComp('Capital Men Extra Competition')).toBe(false);
    expect(isLeagueComp('Capital Men D3')).toBe(true);
    expect(isLeagueComp("MAC 7s - S'kill 7's")).toBe(false);
    expect(isLeagueComp('Capital Women D2-D1 Crossovers')).toBe(false);
  });
});

describe('isSevensComp', () => {
  it('detects sevens tournaments in any naming style', () => {
    expect(isSevensComp("MAC 7s - S'kill 7's")).toBe(true);
    expect(isSevensComp('Mid Atlantic 7s - NOVA Men')).toBe(true);
    expect(isSevensComp('Capital Sevens Qualifier')).toBe(true);
  });

  it('keeps fifteens competitions', () => {
    expect(isSevensComp('Capital Men D3')).toBe(false);
    expect(isSevensComp('MAC Men D1')).toBe(false);
    expect(isSevensComp('Capital Men Extra Competition')).toBe(false);
    expect(isSevensComp('Capital Men D3 Playoffs')).toBe(false);
    expect(isSevensComp('')).toBe(false);
  });
});

describe('divisionRank / compareCompNames', () => {
  it('ranks D1 first working down, unranked last', () => {
    expect(divisionRank('MAC Men D1')).toBe(1);
    expect(divisionRank('Capital Men D4')).toBe(4);
    expect(divisionRank('Capital Men Extra Competition')).toBe(
      Number.MAX_SAFE_INTEGER
    );
  });

  it('sorts D1 above D2 above D3 above unranked, alpha within a division', () => {
    const names = [
      'Capital Men Extra Competition',
      'Capital Men D3',
      'MAC Men D1',
      'Capital Men D4',
      'Capital Men D2',
      'Capital D3 Central Men',
    ];
    expect([...names].sort(compareCompNames)).toEqual([
      'MAC Men D1',
      'Capital Men D2',
      'Capital D3 Central Men',
      'Capital Men D3',
      'Capital Men D4',
      'Capital Men Extra Competition',
    ]);
  });
});

describe('seasonsOf', () => {
  it('returns unique seasons newest first', () => {
    const fixtures = [
      fixture('1', { season: '2024/2025' }),
      fixture('2', { season: '2025/2026' }),
      fixture('3', { season: '2024/2025' }),
    ];
    expect(seasonsOf(fixtures)).toEqual(['2025/2026', '2024/2025']);
  });
});

describe('compsOf', () => {
  it('dedupes competitions and sorts by name', () => {
    const fixtures = [
      fixture('1', { compId: 'b', compName: 'Zulu Men' }),
      fixture('2', { compId: 'a', compName: 'Alpha Men' }),
      fixture('3', { compId: 'a', compName: 'Alpha Men' }),
    ];
    expect(compsOf(fixtures, ALL)).toEqual([
      { compId: 'a', compName: 'Alpha Men' },
      { compId: 'b', compName: 'Zulu Men' },
    ]);
  });

  it('scopes competitions to a season', () => {
    const fixtures = [
      fixture('1', { compId: 'a', compName: 'Alpha Men', season: '2025/2026' }),
      fixture('2', { compId: 'b', compName: 'Zulu Men', season: '2024/2025' }),
    ];
    expect(compsOf(fixtures, '2025/2026')).toEqual([
      { compId: 'a', compName: 'Alpha Men' },
    ]);
  });

  it('drops sevens tournaments and crossovers, listing D1 first working down', () => {
    const fixtures = [
      fixture('1', { compId: 's', compName: "MAC 7s - S'kill 7's" }),
      fixture('4', { compId: 'x', compName: 'Capital Women D2-D1 Crossovers' }),
      fixture('2', { compId: 'd3', compName: 'Capital Men D3' }),
      fixture('3', { compId: 'd1', compName: 'MAC Men D1' }),
    ];
    expect(compsOf(fixtures, ALL)).toEqual([
      { compId: 'd1', compName: 'MAC Men D1' },
      { compId: 'd3', compName: 'Capital Men D3' },
    ]);
  });
});

describe('teamsOf', () => {
  it('returns sorted unique team names for a competition', () => {
    const fixtures = [
      fixture('1', {
        homeTeam: { name: 'Virginia MD3', score: '10', crest: '' },
        awayTeam: { name: 'Rocky Gorge MD3', score: '20', crest: '' },
      }),
      fixture('2', {
        compId: 'other',
        homeTeam: { name: 'NOVA MD3', score: '5', crest: '' },
        awayTeam: { name: 'Severn River MD3', score: '7', crest: '' },
      }),
    ];
    expect(teamsOf(fixtures, ALL, 'comp-d3')).toEqual([
      'Rocky Gorge MD3',
      'Virginia MD3',
    ]);
  });
});

describe('filterFixtures', () => {
  const fixtures = [
    fixture('1', { season: '2025/2026', compId: 'd3' }),
    fixture('2', {
      season: '2024/2025',
      compId: 'd3',
      homeTeam: { name: 'NOVA MD3', score: '5', crest: '' },
      awayTeam: { name: 'Severn River MD3', score: '7', crest: '' },
    }),
    fixture('3', { season: '2025/2026', compId: 'd1', compName: 'MAC Men D1' }),
  ];

  it('passes everything through on All filters', () => {
    expect(
      filterFixtures(fixtures, { season: ALL, compId: ALL, team: ALL })
    ).toHaveLength(3);
  });

  it('filters by season and competition', () => {
    expect(
      filterFixtures(fixtures, { season: '2025/2026', compId: 'd3', team: ALL }).map(
        (item) => item.id
      )
    ).toEqual(['1']);
  });

  it('filters by team on either side of the ball', () => {
    expect(
      filterFixtures(fixtures, { season: ALL, compId: ALL, team: 'NOVA MD3' }).map(
        (item) => item.id
      )
    ).toEqual(['2']);
  });

  it('filters by any of several team names', () => {
    expect(
      filterFixtures(fixtures, {
        season: ALL,
        compId: ALL,
        team: ['NOVA MD3', 'Severn River MD3'],
      }).map((item) => item.id)
    ).toEqual(['2']);
  });
});

describe('resultsOf / upcomingOf', () => {
  it('splits scored games from upcoming fixtures and sorts them', () => {
    const fixtures = [
      fixture('old', { dateTime: '2026-01-01T17:00:00+00:00' }),
      fixture('new', { dateTime: '2026-03-01T17:00:00+00:00' }),
      fixture('future', {
        dateTime: '2026-09-01T17:00:00+00:00',
        homeTeam: { name: 'Rocky Gorge MD3', score: '', crest: '' },
        awayTeam: { name: 'Virginia MD3', score: '', crest: '' },
      }),
    ];
    expect(resultsOf(fixtures).map((item) => item.id)).toEqual(['new', 'old']);
    expect(upcomingOf(fixtures).map((item) => item.id)).toEqual(['future']);
  });

  it('treats a one-sided score as not yet a result', () => {
    const pending = fixture('pending', {
      homeTeam: { name: 'Rocky Gorge MD3', score: '20', crest: '' },
      awayTeam: { name: 'Virginia MD3', score: '', crest: '' },
    });
    expect(isResult(pending)).toBe(false);
    expect(upcomingOf([pending])).toHaveLength(1);
  });
});

describe('defaultSeason', () => {
  it('prefers the newest season with results', () => {
    const fixtures = [
      fixture('1', {
        season: '2026/2027',
        homeTeam: { name: 'A', score: '', crest: '' },
        awayTeam: { name: 'B', score: '', crest: '' },
      }),
      fixture('2', { season: '2025/2026' }),
    ];
    expect(defaultSeason(fixtures)).toBe('2025/2026');
  });
});

describe('ladderKeyFor', () => {  it('builds a ladder key from the first matching fixture', () => {
    const fixtures = [
      fixture('x', { compId: 'd1', season: '2025/2026', sourceType: '' }),
    ];
    expect(ladderKeyFor(fixtures, 'd1', '2025/2026')).toEqual({
      compId: 'd1',
      season: '2025/2026',
      fixtureId: 'x',
      sourceType: '2',
    });
  });

  it('returns null when no fixture matches', () => {
    expect(ladderKeyFor([fixture('x')], 'missing', ALL)).toBeNull();
  });
});

describe('ladderKeysOf', () => {
  it('lists one ladder key per league competition and season', () => {
    const fixtures = [
      fixture('a1', { compId: 'd3', season: '2025/2026' }),
      fixture('a2', { compId: 'd3', season: '2025/2026' }),
      fixture('b1', { compId: 'd3', season: '2024/2025' }),
      fixture('c1', { compId: 'd1', compName: 'MAC Men D1', season: '2025/2026' }),
    ];
    expect(ladderKeysOf(fixtures).map((key) => [key.compId, key.season, key.fixtureId])).toEqual([
      ['d3', '2025/2026', 'a1'],
      ['d3', '2024/2025', 'b1'],
      ['d1', '2025/2026', 'c1'],
    ]);
  });

  it('skips sevens and one-off competitions', () => {
    const fixtures = [
      fixture('s', { compId: 's', compName: "MAC 7s - S'kill 7's" }),
      fixture('x', { compId: 'x', compName: 'Capital Women D2-D1 Crossovers' }),
    ];
    expect(ladderKeysOf(fixtures)).toEqual([]);
  });
});

describe('splitStandingsSnapshot ordering', () => {
  it('orders each season the same way however the feed returned it, so a re-read makes no diff', () => {
    const late = fixture('a', { dateTime: '2026-10-24T17:00:00Z' });
    const tiedB = fixture('c', { dateTime: '2026-10-17T17:00:00Z' });
    const tiedA = fixture('b', { dateTime: '2026-10-17T17:00:00Z' });
    const split = (fixtures: CapitalFixture[]) =>
      splitStandingsSnapshot({ generatedAt: '', fixtures, ladders: {} }).seasons['2025/2026'].fixtures.map((item) => item.id);

    expect(split([late, tiedB, tiedA])).toEqual(['b', 'c', 'a']);
    expect(split([tiedA, late, tiedB])).toEqual(['b', 'c', 'a']);
  });
});

describe('splitStandingsSnapshot ladders', () => {
  it('orders a season\'s ladders the same way however they arrived', () => {
    const ladder = { id: 'x', hasPools: false, ladderPools: [] };
    const fixtures = [fixture('a')];
    const keys = (ladders: Record<string, typeof ladder>) =>
      Object.keys(splitStandingsSnapshot({ generatedAt: '', fixtures, ladders }).seasons['2025/2026'].ladders);
    const a = ladderSnapshotKey('a', '2025/2026');
    const b = ladderSnapshotKey('b', '2025/2026');

    expect(keys({ [b]: ladder, [a]: ladder })).toEqual([a, b]);
  });
});

describe('isPastPage', () => {
  const page = (...seasons: string[]) => seasons.map((season, index) => fixture(`f${index}`, { season }));

  it('ends a feed at a page with nothing from the seasons still being read', () => {
    expect(isPastPage(page('2025/2026', '2024/2025'), '2026/2027')).toBe(true);
  });

  it('carries on through a page with any current fixture', () => {
    expect(isPastPage(page('2026/2027', '2025/2026'), '2026/2027')).toBe(false);
  });

  it('reads everything on a full refresh', () => {
    expect(isPastPage(page('2022/2023'), '')).toBe(false);
  });
});

describe('mergeLeagueFeeds', () => {
  it("adds fixtures from clubs' feeds in the league's competitions, and no others", () => {
    const merged = mergeLeagueFeeds(
      [fixture('base', { compId: 'd2' })],
      [
        [fixture('base', { compId: 'd2' }), fixture('missed', { compId: 'd2' })],
        [fixture('friendly', { compId: 'carolinas' }), fixture('missed', { compId: 'd2' })],
      ],
    );

    expect(merged.map((item) => item.id)).toEqual(['base', 'missed']);
  });
});

describe('leagueClubIds', () => {
  const crest = (id: number) => `https://dpf0m541u9zk8.cloudfront.net/ru/team/${id}.png?v=1`;
  const team = (name: string, teamCrest: string) => ({ ...fixture('x').homeTeam, name, crest: teamCrest });

  it("takes ids from crests, and from the saved clubs for sides with only a placeholder", () => {
    const fixtures = [
      fixture('a', {
        season: '2026/2027',
        homeTeam: team('Raleigh MD2', 'https://d26phqdbpt0w91.cloudfront.net/NonVideo/x.png'),
        awayTeam: team('NOVA MD1', crest(91262)),
      }),
    ];

    const ids = leagueClubIds(fixtures, { Raleigh: { crest: crest(91269) }, Gone: { crest: crest(1) } }, '2026/2027');

    expect(ids.sort()).toEqual([91262, 91269]);
  });

  it('skips clubs seen only in a past season, once past seasons are settled', () => {
    const fixtures = [fixture('a', { season: '2025/2026', homeTeam: team('NOVA MD1', crest(91262)), awayTeam: team('', '') })];

    expect(leagueClubIds(fixtures, {}, '2026/2027')).toEqual([]);
    expect(leagueClubIds(fixtures, {}, '')).toEqual([91262]);
  });
});

describe('buildStandingsSnapshot', () => {
  const ladder = (id: string) => ({ id, hasPools: false, ladderPools: [] });

  describe('with a saved snapshot', () => {
    const CURRENT = '2026/2027';
    const PAST = '2025/2026';
    const key = (compId: string, season: string) => ladderSnapshotKey(compId, season);
    const saved = {
      generatedAt: '2026-11-01T00:00:00Z',
      fixtures: [
        fixture('old', { compId: 'd3', season: PAST, homeTeam: { ...fixture('x').homeTeam, score: 'saved' } }),
        fixture('stale', { compId: 'd3', season: CURRENT }),
      ],
      ladders: { [key('d3', PAST)]: ladder('saved'), [key('d3', CURRENT)]: ladder('saved') },
    };
    const build = (fetched: string[]) =>
      buildStandingsSnapshot({
        fetchFixtures: async () => [
          fixture('new', { compId: 'd3', season: CURRENT }),
          fixture('old', { compId: 'd3', season: PAST, homeTeam: { ...fixture('x').homeTeam, score: 'fresh' } }),
        ],
        fetchLadder: async (ladderKey) => {
          fetched.push(ladderKey.season);
          return ladder('fresh');
        },
        saved,
        refreshFrom: CURRENT,
      });

    it('asks for no ladder from a past season, and keeps the saved one', async () => {
      const fetched: string[] = [];
      const snapshot = await build(fetched);

      expect(fetched).toEqual([CURRENT]);
      expect(snapshot.ladders[key('d3', PAST)]).toEqual(ladder('saved'));
      expect(snapshot.ladders[key('d3', CURRENT)]).toEqual(ladder('fresh'));
    });

    it("keeps a past season's saved fixtures, and replaces the current season's", async () => {
      const snapshot = await build([]);

      expect(snapshot.fixtures.map((item) => item.id).sort()).toEqual(['new', 'old']);
      expect(snapshot.fixtures.find((item) => item.id === 'old')?.homeTeam.score).toBe('saved');
    });
  });

  it('bundles the fixtures with every league ladder, keyed by comp and season', async () => {
    const fixtures = [
      fixture('a1', { compId: 'd3', season: '2025/2026' }),
      fixture('c1', { compId: 'd1', compName: 'MAC Men D1', season: '2025/2026' }),
    ];
    const snapshot = await buildStandingsSnapshot({
      fetchFixtures: async () => fixtures,
      fetchLadder: async (key) => ladder(key.compId),
      now: () => new Date('2026-11-02T10:00:00Z'),
    });
    expect(snapshot.generatedAt).toBe('2026-11-02T10:00:00.000Z');
    expect(snapshot.fixtures).toBe(fixtures);
    expect(snapshot.ladders).toEqual({
      [ladderSnapshotKey('d3', '2025/2026')]: ladder('d3'),
      [ladderSnapshotKey('d1', '2025/2026')]: ladder('d1'),
    });
  });

  it('leaves out ladders that are missing or fail to load', async () => {
    const fixtures = [
      fixture('a1', { compId: 'd3' }),
      fixture('b1', { compId: 'd4', compName: 'Capital Men D4' }),
      fixture('c1', { compId: 'd2', compName: 'Capital Men D2' }),
    ];
    const snapshot = await buildStandingsSnapshot({
      fetchFixtures: async () => fixtures,
      fetchLadder: async (key) => {
        if (key.compId === 'd4') throw new Error('HTTP 429');
        return key.compId === 'd2' ? null : ladder(key.compId);
      },
      now: () => new Date(),
    });
    expect(Object.keys(snapshot.ladders)).toEqual([ladderSnapshotKey('d3', '2025/2026')]);
  });
});

describe('splitStandingsSnapshot', () => {
  const ladder = (id: string) => ({ id, hasPools: false, ladderPools: [] });
  const fixtures = [
    fixture('new1', { compId: 'd3', season: '2025/2026', dateTime: '2026-03-01T17:00:00+00:00' }),
    fixture('new2', {
      compId: 'd3',
      season: '2026/2027',
      dateTime: '2026-12-01T17:00:00+00:00',
      homeTeam: { name: 'A', score: '', crest: '' },
      awayTeam: { name: 'B', score: '', crest: '' },
    }),
    fixture('old1', { compId: 'd3', season: '2024/2025', dateTime: '2025-03-01T17:00:00+00:00' }),
  ];
  const snapshot = {
    generatedAt: '2026-11-02T10:00:00.000Z',
    fixtures,
    ladders: {
      [ladderSnapshotKey('d3', '2025/2026')]: ladder('new'),
      [ladderSnapshotKey('d3', '2024/2025')]: ladder('old'),
    },
  };

  it('writes one file per season, newest first, with that season only', () => {
    const { index, seasons } = splitStandingsSnapshot(snapshot);
    expect(index.seasons).toEqual(['2026/2027', '2025/2026', '2024/2025']);
    expect(seasons['2024/2025']).toEqual({
      season: '2024/2025',
      fixtures: [fixtures[2]],
      ladders: { [ladderSnapshotKey('d3', '2024/2025')]: ladder('old') },
    });
    expect(seasons['2026/2027'].ladders).toEqual({});
  });

  it('indexes the default season as the newest one with results', () => {
    const { index } = splitStandingsSnapshot(snapshot);
    expect(index.defaultSeason).toBe('2025/2026');
    expect(index.generatedAt).toBe('2026-11-02T10:00:00.000Z');
  });
});

describe('seasonSnapshotFile', () => {
  it('turns a season into a safe file name', () => {
    expect(seasonSnapshotFile('2025/2026')).toBe('2025-2026.json');
  });
});

describe('isResult', () => {
  const now = new Date('2026-11-02T12:00:00Z').getTime();

  it('counts a scored game that has been played', () => {
    expect(isResult(fixture('a', { dateTime: '2026-10-31T17:00:00+00:00' }), now)).toBe(true);
  });

  it('ignores scores entered on a game that has not been played yet', () => {
    // e.g. forfeits keyed in ahead of the scheduled date
    const early = fixture('b', {
      dateTime: '2026-11-14T17:00:00+00:00',
      homeTeam: { name: 'Severn River MD3', score: '49', crest: '' },
      awayTeam: { name: 'Loudoun MD3', score: '0', crest: '' },
    });
    expect(isResult(early, now)).toBe(false);
    expect(upcomingOf([early], now).map((item) => item.id)).toEqual(['b']);
    expect(resultsOf([early], now)).toEqual([]);
  });

  it('ignores an unscored game', () => {
    const unscored = fixture('c', {
      dateTime: '2026-10-31T17:00:00+00:00',
      homeTeam: { name: 'A', score: '', crest: '' },
      awayTeam: { name: 'B', score: '', crest: '' },
    });
    expect(isResult(unscored, now)).toBe(false);
  });
});

describe('groupFixturesByDate', () => {
  it('groups by day then division, preserving fixture order', () => {
    const fixtures = [
      fixture('1', {
        dateTime: '2026-03-28T17:45:00+00:00',
        compId: 'd3',
        compName: 'Capital Men D3',
      }),
      fixture('2', {
        dateTime: '2026-03-28T16:25:00+00:00',
        compId: 'wd3',
        compName: 'Capital Women D3',
      }),
      fixture('3', {
        dateTime: '2026-03-28T19:00:00+00:00',
        compId: 'd3',
        compName: 'Capital Men D3',
      }),
      fixture('4', {
        dateTime: '2026-03-21T17:00:00+00:00',
        compId: 'd1',
        compName: 'MAC Men D1',
      }),
    ];
    const groups = groupFixturesByDate(fixtures);
    expect(groups).toHaveLength(2);
    expect(groups[0].divisions.map((division) => division.compName)).toEqual([
      'Capital Men D3',
      'Capital Women D3',
    ]);
    expect(
      groups[0].divisions[0].fixtures.map((item) => item.id)
    ).toEqual(['1', '3']);
    expect(groups[1].divisions.map((division) => division.compName)).toEqual([
      'MAC Men D1',
    ]);
  });

  it('orders divisions D1 first within a day, not alphabetically', () => {
    const fixtures = [
      fixture('1', {
        dateTime: '2026-03-28T17:45:00+00:00',
        compId: 'd3',
        compName: 'Capital Men D3',
      }),
      fixture('2', {
        dateTime: '2026-03-28T16:25:00+00:00',
        compId: 'd1',
        compName: 'MAC Men D1',
      }),
    ];
    const groups = groupFixturesByDate(fixtures);
    expect(groups).toHaveLength(1);
    expect(groups[0].divisions.map((division) => division.compName)).toEqual([
      'MAC Men D1',
      'Capital Men D3',
    ]);
  });

  it('returns an empty list when there are no fixtures', () => {
    expect(groupFixturesByDate([])).toEqual([]);
  });
});

describe('backfillCrests', () => {
  const real = 'https://dpf0m541u9zk8.cloudfront.net/ru/team/91273.png?v=1';
  const placeholder =
    'https://d26phqdbpt0w91.cloudfront.net/NonVideo/d89f330c-59ec-44cb-b7c1-f23052bfa9ee.png';

  function crested(id: string, homeCrest: string, awayCrest: string) {
    return fixture(id, {
      homeTeam: { name: 'Rocky Gorge MD3', score: '20', crest: homeCrest },
      awayTeam: { name: 'NOVA MD3', score: '10', crest: awayCrest },
    });
  }

  it('fills empty and placeholder crests from fixtures with the real logo', () => {
    const filled = backfillCrests([
      crested('1', '', placeholder),
      crested('2', real, real),
    ]);
    expect(filled[0].homeTeam.crest).toBe(real);
    expect(filled[0].awayTeam.crest).toBe(real);
    expect(filled[1].homeTeam.crest).toBe(real);
  });

  it('keeps real crests and leaves placeholders when no real logo exists', () => {
    const filled = backfillCrests([crested('1', real, placeholder)]);
    expect(filled[0].homeTeam.crest).toBe(real);
    expect(filled[0].awayTeam.crest).toBe(placeholder);
  });
});

describe('mergeFixtures', () => {
  it('dedupes by id, keeps primary order, appends secondary-only fixtures', () => {
    const primary = [fixture('1'), fixture('2')];
    const secondary = [fixture('2'), fixture('3')];
    expect(mergeFixtures(primary, secondary).map((item) => item.id)).toEqual([
      '1',
      '2',
      '3',
    ]);
  });

  it('prefers the primary copy on duplicate ids', () => {
    const primary = [
      fixture('1', {
        homeTeam: { name: 'A', score: '30', crest: '' },
        awayTeam: { name: 'B', score: '10', crest: '' },
      }),
    ];
    const secondary = [fixture('1')];
    const merged = mergeFixtures(primary, secondary);
    expect(merged).toHaveLength(1);
    expect(merged[0].homeTeam.score).toBe('30');
  });
});
