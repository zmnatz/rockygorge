import { describe, expect, it } from 'vitest';
import eligibilityConfig from '@config/eligibility.yml';
import { computeBreakdown } from '@/utils/eligibility';
import {
  buildParticipationSnapshot,
  clubConfig,
  clubGaps,
  listClubs,
  loadClubRecord,
  participationRows,
  remainingMatches,
  scheduledResults,
  type ParticipationSnapshot,
  type ResultFixture,
} from '@/utils/participation';
import type { EligibilityConfig, PlayerRow } from '@/types/eligibility';
import type { PlayerGameLog, PlayerHistory } from '@/utils/playerHistory';

const SEASON = '2026/2027';

const result = (id: string, overrides: Partial<ResultFixture> = {}): ResultFixture => ({
  id,
  season: SEASON,
  compName: 'MAC Men D1',
  dateTime: '2026-10-17T17:00:00Z',
  round: 'Round 4',
  homeTeam: { name: 'Rocky Gorge MD1' },
  awayTeam: { name: 'NOVA MD1' },
  ...overrides,
});

const game = (fixtureId: string, overrides: Partial<PlayerGameLog> = {}): PlayerGameLog => ({
  fixtureId,
  season: SEASON,
  dateTime: '2026-10-17T17:00:00Z',
  compName: 'MAC Men D1',
  teamName: 'Rocky Gorge MD1',
  opponent: 'NOVA MD1',
  scoreFor: '10',
  scoreAgainst: '5',
  result: 'W',
  starter: true,
  played: true,
  coach: false,
  ...overrides,
});

const history = (id: string, name: string, games: PlayerGameLog[]): PlayerHistory => ({
  id,
  name,
  teamName: 'Rocky Gorge MD1',
  games,
  scoringEvents: [],
});

describe('buildParticipationSnapshot', () => {
  it("totals starts and substitute appearances, and doesn't count a reserve who never entered", () => {
    const snapshot = buildParticipationSnapshot(
      [
        history('sam', 'Sam Van Der Berg', [
          game('f1'),
          game('f2', { starter: false, played: true }),
          game('f3', { starter: false, played: false }),
        ]),
      ],
      [
        result('f1'),
        result('f2', { round: 'Round 5' }),
        result('f3', { round: 'Round 6' }),
      ],
    );

    expect(snapshot.season).toBe(SEASON);
    expect(snapshot.rows).toEqual([
      {
        playerId: 'sam',
        firstName: 'Sam',
        lastName: 'Van Der Berg',
        lastRegistered: '',
        teamName: 'Rocky Gorge MD1',
        competition: 'MAC Men D1',
        appearances: 2,
        played: 1,
        substitute: 1,
        rounds: { 'Round 4': 'Start', 'Round 5': 'Sub', 'Round 6': 'R' },
      },
    ]);
  });

  it("keeps a player's sides as separate rows", () => {
    const snapshot = buildParticipationSnapshot(
      [
        history('sam', 'Sam Hooker', [
          game('f1'),
          game('f2', { teamName: 'Rocky Gorge MD3', compName: 'Capital Men D3' }),
        ]),
      ],
      [result('f1'), result('f2', { compName: 'Capital Men D3', homeTeam: { name: 'Rocky Gorge MD3' }, awayTeam: { name: 'NOVA MD3' } })],
    );

    expect(snapshot.rows.map((row) => [row.teamName, row.played])).toEqual([
      ['Rocky Gorge MD1', 1],
      ['Rocky Gorge MD3', 1],
    ]);
  });

  it('covers only the latest season with results', () => {
    const snapshot = buildParticipationSnapshot(
      [history('sam', 'Sam Hooker', [game('f1'), game('old', { season: '2025/2026' })])],
      [result('f1'), result('old', { season: '2025/2026' })],
    );

    expect(snapshot.season).toBe(SEASON);
    expect(snapshot.rows[0].played).toBe(1);
  });

  it('leaves coaches out of the rows', () => {
    const snapshot = buildParticipationSnapshot(
      [history('pat', 'Pat Coach', [game('f1', { starter: false, played: false, coach: true })])],
      [result('f1')],
    );

    expect(snapshot.rows).toEqual([]);
  });

  it('flags a side with a result but no lineup, even when only its coach is listed', () => {
    const snapshot = buildParticipationSnapshot(
      [
        history('pat', 'Pat Coach', [game('f1', { starter: false, played: false, coach: true })]),
        history('nia', 'Nia Prop', [game('f1', { teamName: 'NOVA MD1', opponent: 'Rocky Gorge MD1' })]),
      ],
      [result('f1')],
    );

    expect(snapshot.gaps).toEqual([
      {
        kind: 'no-lineup',
        fixtureId: 'f1',
        teamName: 'Rocky Gorge MD1',
        opponent: 'NOVA MD1',
        competition: 'MAC Men D1',
        dateTime: '2026-10-17T17:00:00Z',
      },
    ]);
  });

  it('flags a side whose listed substitutes all show as unused, but not one with a used substitute', () => {
    const snapshot = buildParticipationSnapshot(
      [
        history('sam', 'Sam Hooker', [game('f1')]),
        history('joe', 'Joe Bench', [game('f1', { starter: false, played: false })]),
        history('nia', 'Nia Prop', [game('f1', { teamName: 'NOVA MD1', opponent: 'Rocky Gorge MD1' })]),
        history('ola', 'Ola Bench', [
          game('f1', { teamName: 'NOVA MD1', opponent: 'Rocky Gorge MD1', starter: false, played: true }),
        ]),
      ],
      [result('f1')],
    );

    expect(snapshot.gaps.map((gap) => [gap.teamName, gap.kind])).toEqual([
      ['Rocky Gorge MD1', 'no-substitutions'],
    ]);
  });

  it('ignores fixtures dated after the snapshot, which can carry placeholder scores', () => {
    const snapshot = buildParticipationSnapshot(
      [history('sam', 'Sam Hooker', [game('f1')]), history('nia', 'Nia Prop', [game('f1', { teamName: 'NOVA MD1', opponent: 'Rocky Gorge MD1', starter: true })])],
      [result('f1'), result('later', { dateTime: '2026-11-14T18:00:00Z' })],
      new Date('2026-11-06T00:00:00Z'),
    );

    expect(snapshot.gaps).toEqual([]);
  });

  it('does not flag or count a forfeit, even with a lineup posted', () => {
    const snapshot = buildParticipationSnapshot(
      [history('sam', 'Sam Hooker', [game('f1')])],
      [result('f1', { status: 'Forfeit' })],
    );

    expect(snapshot.gaps).toEqual([]);
    expect(snapshot.rows).toEqual([]);
  });

  it('gives identical output whatever order the histories arrive in', () => {
    const histories = [
      history('b', 'B Player', [game('f1')]),
      history('a', 'A Player', [game('f1')]),
    ];
    const results = [result('f1')];

    expect(buildParticipationSnapshot([...histories].reverse(), results)).toEqual(
      buildParticipationSnapshot(histories, results),
    );
  });
});

const baseConfig: EligibilityConfig = {
  upperDivision: { teamName: 'Rocky Gorge MD1', label: 'D1', minimumTotalMatches: 2 },
  lowerDivision: {
    teamName: 'Rocky Gorge MD3',
    label: 'D3',
    minimumMatches: 2,
    upperMatchLimit: 4,
    lowerAtLeastUpper: true,
  },
  nonQualifyingCompetitions: eligibilityConfig.nonQualifyingCompetitions,
  deadlineCompetitions: eligibilityConfig.deadlineCompetitions,
};

const row = (overrides: Partial<PlayerRow>): PlayerRow => ({
  playerId: 'sam',
  firstName: 'Sam',
  lastName: 'Hooker',
  lastRegistered: '',
  teamName: 'NOVA MD1',
  competition: 'MAC Men D1',
  appearances: 0,
  played: 0,
  substitute: 0,
  rounds: {},
  ...overrides,
});

const snapshotOf = (rows: PlayerRow[]): ParticipationSnapshot => ({ season: SEASON, rows, gaps: [] });

const fixtureOf = (home: string, away: string, compName = 'Capital Men D3') => ({
  compName,
  homeTeam: { name: home },
  awayTeam: { name: away },
});

describe('listClubs', () => {
  it('lists clubs with two sides, ranked upper then lower, sorted by name', () => {
    const clubs = listClubs(
      [
        fixtureOf('Rocky Gorge MD3', 'James River MD3'),
        fixtureOf('Rocky Gorge MD1', 'NOVA MD1', 'MAC Men D1'),
        fixtureOf('James River MD2', 'Raleigh MD2', 'Capital Men D2'),
      ],
      baseConfig,
    );

    expect(clubs).toEqual([
      {
        name: 'James River',
        upperTeam: 'James River MD2',
        lowerTeam: 'James River MD3',
        upperLabel: 'D2',
        lowerLabel: 'D3',
      },
      {
        name: 'Rocky Gorge',
        upperTeam: 'Rocky Gorge MD1',
        lowerTeam: 'Rocky Gorge MD3',
        upperLabel: 'D1',
        lowerLabel: 'D3',
      },
    ]);
  });

  it('leaves out clubs with one side', () => {
    const clubs = listClubs([fixtureOf('Frederick MD3', 'Loudoun MD3')], baseConfig);

    expect(clubs).toEqual([]);
  });

  it("lists a club's women's sides separately from its men's", () => {
    const clubs = listClubs(
      [
        fixtureOf('NOVA WD1', 'Boston WD1', 'Atlantic Women D1'),
        fixtureOf('NOVA WD3', 'Stingers WD3', 'Capital Women D3'),
        fixtureOf('NOVA MD1', 'Washington MD1', 'MAC Men D1'),
      ],
      baseConfig,
    );

    expect(clubs.map((club) => [club.name, club.upperTeam, club.lowerTeam])).toEqual([
      ['NOVA Women', 'NOVA WD1', 'NOVA WD3'],
    ]);
  });

  it('only counts sides in qualifying competitions', () => {
    const clubs = listClubs(
      [
        fixtureOf('Rocky Gorge MD1', 'NOVA MD1', 'MAC Men D1'),
        fixtureOf('Rocky Gorge MD3', 'NOVA MD2', 'MAC 7s - Rites of Summer'),
      ],
      baseConfig,
    );

    expect(clubs).toEqual([]);
  });

  it('ignores unnamed sides', () => {
    expect(listClubs([fixtureOf('', '')], baseConfig)).toEqual([]);
  });
});

describe('record-based eligibility', () => {
  const [club] = listClubs([fixtureOf('NOVA MD1', 'NOVA MD3')], baseConfig);

  it("evaluates another club's sides under the regulation thresholds", () => {
    const config = clubConfig(club, baseConfig);
    const snapshot = snapshotOf([
      row({ playerId: 'sam', teamName: 'NOVA MD1', played: 1 }),
      row({ playerId: 'sam', teamName: 'NOVA MD3', competition: 'Capital Men D3', played: 1 }),
      row({ playerId: 'other', teamName: 'Rocky Gorge MD1', played: 9 }),
    ]);

    const breakdown = computeBreakdown(participationRows(snapshot, club, config), config);

    expect(breakdown.upper.map((player) => [player.playerId, player.eligible])).toEqual([['sam', true]]);
    expect(breakdown.lower.map((player) => [player.playerId, player.eligible])).toEqual([['sam', false]]);
    expect(breakdown.lower[0].reasons).toEqual(['Needs 2 D3 matches (has 1)']);
    expect(breakdown.ignoredTeamNames).toEqual([]);
  });

  it('evaluates a player listed on one side for the other side too', () => {
    const config = clubConfig(club, baseConfig);
    const snapshot = snapshotOf([
      row({ playerId: 'lower-only', teamName: 'NOVA MD3', competition: 'Capital Men D3', played: 2 }),
      row({ playerId: 'upper-only', teamName: 'NOVA MD1', played: 2 }),
    ]);

    const breakdown = computeBreakdown(participationRows(snapshot, club, config), config);
    const verdict = (players: typeof breakdown.upper, id: string) =>
      players.find((player) => player.playerId === id);

    expect(verdict(breakdown.upper, 'lower-only')).toMatchObject({
      participation: 0,
      otherDivisionParticipation: 2,
      eligible: true,
    });
    expect(verdict(breakdown.lower, 'upper-only')).toMatchObject({
      participation: 0,
      otherDivisionParticipation: 2,
      eligible: false,
    });
    expect(breakdown.upperSummary.competitions).toEqual(['MAC Men D1']);
    expect(breakdown.lowerSummary.competitions).toEqual(['Capital Men D3']);
  });

  it("counts league and playoff matches but not 7s", () => {
    const config = clubConfig(club, baseConfig);
    const snapshot = snapshotOf([
      row({ teamName: 'NOVA MD1', played: 1 }),
      row({ teamName: 'NOVA MD1', competition: 'Capital Men D3 Playoffs', played: 1 }),
      row({ teamName: 'NOVA MD1', competition: '2027 Super Regional Atlantic', played: 1 }),
      row({ teamName: 'NOVA MD1', competition: '2027 National Championships', played: 1 }),
      row({ teamName: 'NOVA MD1', competition: 'MAC 7s - Rites of Summer', played: 1 }),
      row({ teamName: 'NOVA MD1', competition: "S'kill 7's", played: 1 }),
      row({ teamName: 'NOVA MD1', competition: 'Beltway Sevens', played: 1 }),
    ]);

    const breakdown = computeBreakdown(participationRows(snapshot, club, config), config);

    expect(breakdown.upper[0].participation).toBe(4);
    expect(breakdown.upperSummary.competitions).toEqual([
      '2027 National Championships',
      '2027 Super Regional Atlantic',
      'Capital Men D3 Playoffs',
      'MAC Men D1',
    ]);
  });

  it("reports gaps only for the club's own sides in qualifying competitions", () => {
    const config = clubConfig(club, baseConfig);
    const gap = (teamName: string, competition: string) => ({
      kind: 'no-lineup' as const,
      fixtureId: 'f1',
      teamName,
      opponent: 'Other',
      competition,
      dateTime: '2026-10-17T17:00:00Z',
    });
    const snapshot: ParticipationSnapshot = {
      season: SEASON,
      rows: [],
      gaps: [
        gap('NOVA MD1', 'MAC Men D1'),
        gap('Rocky Gorge MD1', 'MAC Men D1'),
        gap('NOVA MD3', 'MAC 7s - Rites of Summer'),
      ],
    };

    expect(clubGaps(snapshot, club, config).map((item) => item.teamName)).toEqual(['NOVA MD1']);
  });
});

describe('loadClubRecord', () => {
  const NOW = new Date('2026-11-06T12:00:00Z');
  const [club] = listClubs([fixtureOf('NOVA MD1', 'NOVA MD3')], baseConfig);

  const scheduled = (id: string, overrides: Record<string, unknown> = {}) => ({
    id,
    compId: 'comp',
    compName: 'MAC Men D1',
    season: SEASON,
    dateTime: '2026-10-17T17:00:00Z',
    round: 'Round 4',
    status: 'Result',
    sourceType: '2',
    homeTeam: { name: 'NOVA MD1', score: '' },
    awayTeam: { name: 'Rocky Gorge MD1', score: '' },
    ...overrides,
  });

  const matchFor = (id: string, score = '10') => ({
    fixture: {
      id,
      compId: 'comp',
      compName: 'MAC Men D1',
      season: SEASON,
      dateTime: '2026-10-17T17:00:00Z',
      venue: '',
      homeTeam: { id: 'h', name: 'NOVA MD1', teamId: 'h', score, crest: '' },
      awayTeam: { id: 'a', name: 'Rocky Gorge MD1', teamId: 'a', score, crest: '' },
    },
    commentary: [],
    players: [{ id: 'sam__1', name: 'Sam Hooker', position: '1', shirtNumber: '1', isHome: true }],
    substitutes: [],
    coaches: [],
  });

  const saved: ParticipationSnapshot = {
    season: SEASON,
    generatedAt: '2026-11-06T06:00:00.000Z',
    rows: [row({ teamName: 'NOVA MD1', played: 3 })],
    gaps: [],
  };

  const deps = (overrides = {}) => ({
    live: true,
    now: NOW,
    fixtures: [scheduled('f1')],
    fetchMatch: async (fixture: { id: string }) => matchFor(fixture.id),
    loadSaved: async () => saved,
    pullOptions: { gapMs: 0, retryDelayMs: 0 },
    ...overrides,
  });

  it("pulls the club's played fixtures live, using the results it finds", async () => {
    const fetched: string[] = [];
    const record = await loadClubRecord(
      club,
      deps({
        fixtures: [
          scheduled('mine'),
          scheduled('other-club', { homeTeam: { name: 'Washington MD1', score: '' } }),
          scheduled('upcoming', { dateTime: '2026-11-14T17:00:00Z' }),
          scheduled('last-season', { season: '2025/2026' }),
        ],
        fetchMatch: async (fixture: { id: string }) => {
          fetched.push(fixture.id);
          return matchFor(fixture.id);
        },
      }),
    );

    expect(fetched).toEqual(['mine']);
    expect(record.source).toBe('live');
    expect(record.asOf).toBe(NOW.toISOString());
    expect(record.snapshot.season).toBe(SEASON);
    expect(record.snapshot.rows).toMatchObject([
      { playerId: 'sam', teamName: 'NOVA MD1', played: 1, rounds: { 'Round 4': 'Start' } },
    ]);
  });

  it('does not count a lineup posted for a match with no score yet', async () => {
    const record = await loadClubRecord(
      club,
      deps({ fetchMatch: async (fixture: { id: string }) => matchFor(fixture.id, '') }),
    );

    expect(record.snapshot.rows).toEqual([]);
    expect(record.snapshot.gaps).toEqual([]);
  });

  it('flags a scored fixture when the live pull finds no lineup', async () => {
    const record = await loadClubRecord(
      club,
      deps({
        fixtures: [scheduled('f1', {
          homeTeam: { name: 'NOVA MD1', score: '10' },
          awayTeam: { name: 'Rocky Gorge MD1', score: '5' },
        })],
        fetchMatch: async () => null,
      }),
    );

    expect(record.snapshot.gaps.filter((gap) => gap.teamName === 'NOVA MD1')).toMatchObject([
      { kind: 'no-lineup', fixtureId: 'f1' },
    ]);
  });

  it('does not fetch a forfeit', async () => {
    const fetched: string[] = [];
    await loadClubRecord(
      club,
      deps({
        fixtures: [scheduled('f1', { status: 'Forfeit' })],
        fetchMatch: async (fixture: { id: string }) => {
          fetched.push(fixture.id);
          return null;
        },
      }),
    );

    expect(fetched).toEqual([]);
  });

  it('stops pulling at the first failure so the fallback is quick', async () => {
    const fetched: string[] = [];
    const record = await loadClubRecord(
      club,
      deps({
        fixtures: [scheduled('first'), scheduled('second'), scheduled('third')],
        pullOptions: { gapMs: 0, retryDelayMs: 0, concurrency: 1 },
        fetchMatch: async (fixture: { id: string }) => {
          fetched.push(fixture.id);
          throw new Error('Request failed: 429');
        },
      }),
    );

    expect(fetched).toEqual(['first']);
    expect(record.liveFailed).toBe(true);
  });

  it("uses the latest season that has started, not one that's only scheduled", async () => {
    const record = await loadClubRecord(
      club,
      deps({
        fixtures: [
          scheduled('current'),
          scheduled('next-season', { season: '2027/2028', dateTime: '2027-09-01T17:00:00Z' }),
        ],
      }),
    );

    expect(record.snapshot.season).toBe(SEASON);
    expect(record.snapshot.rows).toHaveLength(1);
  });

  it('falls back to the saved snapshot when the live pull fails, and says so', async () => {
    const record = await loadClubRecord(
      club,
      deps({
        fetchMatch: async () => {
          throw new Error('Request failed: 429');
        },
      }),
    );

    expect(record.source).toBe('saved');
    expect(record.liveFailed).toBe(true);
    expect(record.asOf).toBe(saved.generatedAt);
    expect(record.snapshot).toBe(saved);
  });

  it('fails when the live pull fails and the saved snapshot lacks the club', async () => {
    await expect(
      loadClubRecord(
        club,
        deps({
          fetchMatch: async () => {
            throw new Error('Request failed: 429');
          },
          loadSaved: async () => ({ ...saved, rows: [row({ teamName: 'Other MD1' })] }),
        }),
      ),
    ).rejects.toThrow(/NOVA/);
  });

  it('uses only the saved snapshot outside live mode', async () => {
    const record = await loadClubRecord(
      club,
      deps({
        live: false,
        fetchMatch: async () => {
          throw new Error('should not fetch');
        },
      }),
    );

    expect(record).toMatchObject({ source: 'saved', liveFailed: false });
  });
});

describe('scheduledResults', () => {
  const NOW = new Date('2026-11-06T12:00:00Z');
  const scheduled = (id: string, overrides: Record<string, unknown> = {}) => ({
    id,
    compId: 'd2',
    compName: 'Capital Men D2',
    season: SEASON,
    dateTime: '2026-10-17T17:00:00Z',
    status: 'Result',
    sourceType: '2',
    homeTeam: { name: 'James River MD2', score: '10' },
    awayTeam: { name: 'Raleigh MD2', score: '5' },
    ...overrides,
  });

  it("adds played fixtures the club feed doesn't have, and nothing else", () => {
    const unscored = {
      homeTeam: { name: 'James River MD2', score: '' },
      awayTeam: { name: 'Raleigh MD2', score: '' },
    };
    const extra = scheduledResults(
      [result('in-feed')],
      [
        scheduled('in-feed'),
        scheduled('d2-result'),
        scheduled('women', { compName: 'Atlantic Women D1' }),
        scheduled('not-played', unscored),
        scheduled('upcoming-placeholder', { dateTime: '2026-11-14T17:00:00Z' }),
      ],
      NOW,
    );

    expect(extra.map((fixture) => fixture.id)).toEqual(['d2-result', 'women']);
  });

  it('gives a side outside the club feed rows, and a gap when it has no lineup', () => {
    const [withLineup, withoutLineup] = scheduledResults(
      [],
      [scheduled('f1'), scheduled('f2', { dateTime: '2026-10-24T17:00:00Z' })],
      NOW,
    );
    const snapshot = buildParticipationSnapshot(
      [
        history('jo', 'Jo Prop', [
          game('f1', { compName: 'Capital Men D2', teamName: 'James River MD2', opponent: 'Raleigh MD2' }),
        ]),
        history('al', 'Al Lock', [
          game('f1', { compName: 'Capital Men D2', teamName: 'Raleigh MD2', opponent: 'James River MD2' }),
        ]),
      ],
      [withLineup, withoutLineup],
      NOW,
    );

    expect(snapshot.rows.map((row) => [row.teamName, row.played])).toEqual([
      ['James River MD2', 1],
      ['Raleigh MD2', 1],
    ]);
    expect(snapshot.gaps.map((gap) => [gap.fixtureId, gap.teamName, gap.kind])).toEqual([
      ['f2', 'James River MD2', 'no-lineup'],
      ['f2', 'Raleigh MD2', 'no-lineup'],
    ]);
  });
});

describe('remainingMatches', () => {
  const NOW = new Date('2026-11-06T12:00:00Z');
  const sides = { upperTeam: 'Rocky Gorge MD1', lowerTeam: 'Rocky Gorge MD3' };
  const upcoming = (overrides: Record<string, unknown> = {}) => ({
    compName: 'MAC Men D1',
    dateTime: '2026-11-14T17:00:00Z',
    status: 'Fixture',
    homeTeam: { name: 'Rocky Gorge MD1', score: '' },
    awayTeam: { name: 'NOVA MD1', score: '' },
    ...overrides,
  });

  it("counts each side's fixtures still to play, home or away", () => {
    expect(
      remainingMatches(
        [
          upcoming(),
          upcoming({ homeTeam: { name: 'NOVA MD1', score: '' }, awayTeam: { name: 'Rocky Gorge MD1', score: '' } }),
          upcoming({ compName: 'Capital Men D3', homeTeam: { name: 'Rocky Gorge MD3', score: '' } }),
        ],
        sides,
        baseConfig,
        NOW,
      ),
    ).toEqual({ upper: 2, lower: 1 });
  });

  describe('playoff fixtures with no teams assigned', () => {
    const unassigned = (overrides: Record<string, unknown> = {}) =>
      upcoming({
        dateTime: '2027-04-10T17:00:00Z',
        homeTeam: { name: '', score: '' },
        awayTeam: { name: '', score: '' },
        ...overrides,
      });
    const played = upcoming({
      dateTime: '2026-10-01T17:00:00Z',
      status: 'Result',
      homeTeam: { name: 'Rocky Gorge MD1', score: '20' },
      awayTeam: { name: 'NOVA MD1', score: '5' },
    });
    const lowerPlayed = {
      ...played,
      compName: 'Capital Men D3',
      homeTeam: { name: 'Rocky Gorge MD3', score: '20' },
      awayTeam: { name: 'NOVA MD3', score: '5' },
    };

    it("count for each side in that division, as one possible game per date", () => {
      expect(
        remainingMatches(
          [
            played,
            lowerPlayed,
            unassigned(),
            unassigned(),
            unassigned({ dateTime: '2027-04-17T17:00:00Z' }),
            unassigned({ compName: 'Capital Men D3', dateTime: '2027-04-03T17:00:00Z' }),
            unassigned({ compName: 'Capital Men D3', dateTime: '2027-04-03T17:00:00Z' }),
          ],
          sides,
          baseConfig,
          NOW,
        ),
      ).toEqual({ upper: 2, lower: 1 });
    });

    it("don't count for a side that doesn't play in that division", () => {
      expect(
        remainingMatches(
          [played, unassigned({ compName: 'Capital Men D2' })],
          sides,
          baseConfig,
          NOW,
        ),
      ).toEqual({ upper: 0, lower: 0 });
    });

    it('count from a separate playoff competition for the same division', () => {
      expect(
        remainingMatches(
          [lowerPlayed, unassigned({ compName: 'Capital Men D3 Playoffs' })],
          sides,
          baseConfig,
          NOW,
        ),
      ).toEqual({ upper: 0, lower: 1 });
    });

    it('count when only one team has been assigned', () => {
      expect(
        remainingMatches(
          [played, unassigned({ homeTeam: { name: 'NOVA MD1', score: '' } })],
          sides,
          baseConfig,
          NOW,
        ),
      ).toEqual({ upper: 1, lower: 0 });
    });

    it("don't add a game on a date the side already has a fixture", () => {
      expect(
        remainingMatches(
          [
            played,
            upcoming({ dateTime: '2027-04-10T17:00:00Z' }),
            unassigned(),
          ],
          sides,
          baseConfig,
          NOW,
        ),
      ).toEqual({ upper: 1, lower: 0 });
    });

    it("don't count once past, or at Super Regionals", () => {
      expect(
        remainingMatches(
          [
            played,
            unassigned({ dateTime: '2026-10-02T17:00:00Z' }),
            unassigned({ compName: '2027 Super Regional Atlantic' }),
          ],
          sides,
          baseConfig,
          NOW,
        ),
      ).toEqual({ upper: 0, lower: 0 });
    });
  });

  it("counts local playoffs, but not other clubs', played, forfeited or postponed fixtures, 7s, or anything from Super Regionals on", () => {
    expect(
      remainingMatches(
        [
          upcoming({ compName: 'Capital Men D3 Playoffs' }),
          upcoming({ homeTeam: { name: 'Washington MD1', score: '' } }),
          upcoming({ dateTime: '2026-10-01T17:00:00Z' }),
          upcoming({ homeTeam: { name: 'Rocky Gorge MD1', score: '20' } }),
          upcoming({ status: 'Forfeit' }),
          upcoming({ status: 'Postponed' }),
          upcoming({ compName: 'MAC 7s - Rites of Summer' }),
          upcoming({ compName: '2027 Super Regional Atlantic' }),
          upcoming({ compName: '2027 National Championships' }),
        ],
        sides,
        baseConfig,
        NOW,
      ),
    ).toEqual({ upper: 1, lower: 0 });
  });
});
