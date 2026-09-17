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
  isResult,
  isSevensComp,
  ladderKeyFor,
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

  it('drops sevens tournaments and lists D1 first working down', () => {
    const fixtures = [
      fixture('1', { compId: 's', compName: "MAC 7s - S'kill 7's" }),
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
