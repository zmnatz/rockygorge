import { describe, expect, it } from 'vitest';
import eligibilityConfig from '@config/eligibility.yml';
import { computeBreakdown } from '@/utils/eligibility';
import {
  buildParticipationSnapshot,
  clubGaps,
  listClubs,
  loadClubRecord,
  participationRows,
  playerRounds,
  possibleFixtures,
  playerSeasonEligibility,
  remainingMatches,
  leagueResults,
  type ParticipationSnapshot,
  type ResultFixture,
} from '@/utils/participation';
import type { Club, EligibilityRules, PlayerRow } from '@/types/eligibility';
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
        rounds: { f1: 'Start', f2: 'Sub', f3: 'R' },
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

  it('records the fixtures it has results for, including ones with gaps', () => {
    const snapshot = buildParticipationSnapshot(
      [history('sam', 'Sam Hooker', [game('with-lineup')])],
      [result('with-lineup'), result('no-lineup'), result('old', { season: '2025/2026' })],
    );

    expect(snapshot.resultIds).toEqual(['no-lineup', 'with-lineup']);
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

const baseConfig: EligibilityRules = {
  minimumMatches: 2,
  upperMatchLimit: 4,
  nonQualifyingCompetitions: eligibilityConfig.nonQualifyingCompetitions,
};

const sideOf = (teamName: string, level: number) => ({ teamName, label: `D${level}` });

/** A club's verdicts for its top and second side. */
const verdictsFor = (club: Club, rows: PlayerRow[], remaining: Record<string, number> = {}) => {
  const { sides, ignoredTeamNames } = computeBreakdown(rows, club.sides, baseConfig, remaining);
  return {
    upper: sides[0].players,
    lower: sides[1]?.players ?? [],
    upperSummary: sides[0].summary,
    lowerSummary: sides[1]?.summary,
    ignoredTeamNames,
  };
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
        fixtureOf('Rocky Gorge MD1', '', 'MAC Men D1'),
        fixtureOf('James River MD2', '', 'Capital Men D2'),
      ],
      baseConfig,
    );

    expect(clubs).toEqual([
      { name: 'James River', sides: [sideOf('James River MD2', 2), sideOf('James River MD3', 3)] },
      { name: 'Rocky Gorge', sides: [sideOf('Rocky Gorge MD1', 1), sideOf('Rocky Gorge MD3', 3)] },
    ]);
  });

  it('lists a club with one side', () => {
    const clubs = listClubs([fixtureOf('Frederick MD3', 'Rocky Gorge MD3')], baseConfig);

    expect(clubs).toContainEqual({ name: 'Frederick', sides: [sideOf('Frederick MD3', 3)] });
  });

  it('lists a club fielding three sides, highest division first', () => {
    const clubs = listClubs(
      [
        fixtureOf('Tri MD1', 'NOVA MD1', 'MAC Men D1'),
        fixtureOf('Tri MD2', 'Raleigh MD2', 'Capital Men D2'),
        fixtureOf('Tri MD3', 'Loudoun MD3'),
      ],
      baseConfig,
    );

    expect(clubs.find((club) => club.name === 'Tri')?.sides.map((side) => side.teamName)).toEqual([
      'Tri MD1',
      'Tri MD2',
      'Tri MD3',
    ]);
  });

  it("lists a club's women's sides separately from its men's", () => {
    const clubs = listClubs(
      [
        fixtureOf('NOVA WD1', 'Boston WD1', 'Atlantic Women D1'),
        fixtureOf('NOVA WD2', 'Raleigh WD2', 'Capital Women D2'),
        fixtureOf('NOVA MD1', 'Washington MD1', 'MAC Men D1'),
      ],
      baseConfig,
    );

    expect(clubs.find((club) => club.name === 'NOVA Women')?.sides).toEqual([
      { teamName: 'NOVA WD1', label: 'D1' },
      { teamName: 'NOVA WD2', label: 'D2' },
    ]);
    expect(clubs.find((club) => club.name === 'NOVA')?.sides).toEqual([{ teamName: 'NOVA MD1', label: 'D1' }]);
  });

  it('only counts sides in qualifying competitions', () => {
    const clubs = listClubs(
      [
        fixtureOf('Rocky Gorge MD1', 'NOVA MD1', 'MAC Men D1'),
        fixtureOf('Rocky Gorge MD3', 'NOVA MD2', 'MAC 7s - Rites of Summer'),
      ],
      baseConfig,
    );

    expect(clubs.find((club) => club.name === 'Rocky Gorge')?.sides).toEqual([
      { teamName: 'Rocky Gorge MD1', label: 'D1' },
    ]);
  });

  it('ignores unnamed sides', () => {
    expect(listClubs([fixtureOf('', '')], baseConfig)).toEqual([]);
  });
});

describe('record-based eligibility', () => {
  describe('a club with one side', () => {
    const [club] = listClubs([{ ...fixtureOf('Loudoun MD3', ''), compName: 'Capital Men D3' }], baseConfig);
    const config = baseConfig;
    const verdicts = (rows: PlayerRow[], remaining: Record<string, number> = {}) =>
      verdictsFor(club, participationRows(snapshotOf(rows), club, config), remaining);

    it('needs two qualifying matches, and has no other side to check', () => {
      const breakdown = verdicts([
        row({ playerId: 'two', teamName: 'Loudoun MD3', played: 1, substitute: 1, competition: 'Capital Men D3' }),
        row({ playerId: 'one', teamName: 'Loudoun MD3', played: 1, competition: 'Capital Men D3' }),
      ]);

      const byId = Object.fromEntries(breakdown.upper.map((player) => [player.playerId, player]));
      expect(byId.two.eligible).toBe(true);
      expect(byId.two.otherSides).toEqual([]);
      expect(byId.one.eligible).toBe(false);
      expect(byId.one.reasons).toEqual(['Needs 2 qualifying matches (has 1)']);
      expect(breakdown.lower).toEqual([]);
    });

    it("marks a player on track when the side's remaining fixtures can reach the minimum", () => {
      const [player] = verdicts(
        [row({ playerId: 'one', teamName: 'Loudoun MD3', played: 1, competition: 'Capital Men D3' })],
        { 'Loudoun MD3': 1 },
      ).upper;

      expect(player.eligible).toBe(true);
      expect(player.pending).toEqual(['Needs 1 more qualifying match (1 fixture left)']);
    });

    it('does not treat open playoff slots, which have no team name, as a lower side', () => {
      const open = {
        compName: 'Capital Men D3 Playoffs',
        dateTime: '2027-03-01T17:00:00Z',
        homeTeam: { name: '', score: '' },
        awayTeam: { name: '', score: '' },
      };
      const remaining = remainingMatches([open], club, config, new Date('2026-11-06T12:00:00Z'));

      expect(remaining).toEqual({ 'Loudoun MD3': 0 });
    });
  });

  const [club] = listClubs([fixtureOf('NOVA MD1', 'NOVA MD3')], baseConfig);

  it("evaluates another club's sides under the regulation thresholds", () => {
    const config = baseConfig;
    const snapshot = snapshotOf([
      row({ playerId: 'sam', teamName: 'NOVA MD1', played: 1 }),
      row({ playerId: 'sam', teamName: 'NOVA MD3', competition: 'Capital Men D3', played: 1 }),
      row({ playerId: 'other', teamName: 'Rocky Gorge MD1', played: 9 }),
    ]);

    const breakdown = verdictsFor(club, participationRows(snapshot, club, config));

    expect(breakdown.upper.map((player) => [player.playerId, player.eligible])).toEqual([['sam', true]]);
    expect(breakdown.lower.map((player) => [player.playerId, player.eligible])).toEqual([['sam', false]]);
    expect(breakdown.lower[0].reasons).toEqual(['Needs 2 D3 matches (has 1)']);
    expect(breakdown.ignoredTeamNames).toEqual([]);
  });

  it('evaluates a player listed on one side for the other side too', () => {
    const config = baseConfig;
    const snapshot = snapshotOf([
      row({ playerId: 'lower-only', teamName: 'NOVA MD3', competition: 'Capital Men D3', played: 2 }),
      row({ playerId: 'upper-only', teamName: 'NOVA MD1', played: 2 }),
    ]);

    const breakdown = verdictsFor(club, participationRows(snapshot, club, config));
    const verdict = (players: typeof breakdown.upper, id: string) =>
      players.find((player) => player.playerId === id);

    expect(verdict(breakdown.upper, 'lower-only')).toMatchObject({
      participation: 0,
      otherSides: [expect.objectContaining({ participation: 2 })],
      eligible: true,
    });
    expect(verdict(breakdown.lower, 'upper-only')).toMatchObject({
      participation: 0,
      otherSides: [expect.objectContaining({ participation: 2 })],
      eligible: false,
    });
    expect(breakdown.upperSummary.competitions).toEqual(['MAC Men D1']);
    expect(breakdown.lowerSummary.competitions).toEqual(['Capital Men D3']);
  });

  it('counts league and local playoff matches, but not Super Regionals, National Championships or 7s', () => {
    const config = baseConfig;
    const snapshot = snapshotOf([
      row({ teamName: 'NOVA MD1', played: 1 }),
      row({ teamName: 'NOVA MD1', competition: 'Capital Men D3 Playoffs', played: 1 }),
      row({ teamName: 'NOVA MD1', competition: '2027 Super Regional Atlantic', played: 1 }),
      row({ teamName: 'NOVA MD1', competition: 'ASR Final 2027', played: 1 }),
      row({ teamName: 'NOVA MD1', competition: '2027 National Championships', played: 1 }),
      row({ teamName: 'NOVA MD1', competition: 'MAC 7s - Rites of Summer', played: 1 }),
      row({ teamName: 'NOVA MD1', competition: "S'kill 7's", played: 1 }),
      row({ teamName: 'NOVA MD1', competition: 'Beltway Sevens', played: 1 }),
    ]);

    const breakdown = verdictsFor(club, participationRows(snapshot, club, config));

    expect(breakdown.upper[0].participation).toBe(2);
    expect(breakdown.upperSummary.competitions).toEqual([
      'Capital Men D3 Playoffs',
      'MAC Men D1',
    ]);
  });

  it("reports gaps only for the club's own sides in qualifying competitions", () => {
    const config = baseConfig;
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
        gap('NOVA MD3', '2027 National Championships'),
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
    generatedAt: '2026-10-01T06:00:00.000Z',
    rows: [row({ teamName: 'NOVA MD1', played: 3 })],
    gaps: [],
  };

  const deps = (overrides = {}) => ({
    live: true,
    now: NOW,
    fixtures: [scheduled('f1')],
    fetchMatch: async (fixture: { id: string }) => matchFor(fixture.id),
    loadSaved: async () => null,
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
      { playerId: 'sam', teamName: 'NOVA MD1', played: 1, rounds: { mine: 'Start' } },
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
        loadSaved: async () => saved,
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
        loadSaved: async () => saved,
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

  describe('with a saved snapshot covering both sides', () => {
    const bothSides: ParticipationSnapshot = {
      season: SEASON,
      generatedAt: '2026-10-20T06:00:00.000Z',
      resultIds: ['old'],
      rows: [
        row({ playerId: 'sam', teamName: 'NOVA MD1', appearances: 2, played: 2, rounds: { old: 'Start', older: 'Start' } }),
        row({ playerId: 'other', teamName: 'NOVA MD3', competition: 'Capital Men D3', played: 1 }),
      ],
      gaps: [],
    };
    const pulling = (fetched: string[]) => async (fixture: { id: string }) => {
      fetched.push(fixture.id);
      return matchFor(fixture.id);
    };

    it('makes no requests when every played fixture already has a result', async () => {
      const fetched: string[] = [];
      const record = await loadClubRecord(
        club,
        deps({
          fixtures: [scheduled('old', { dateTime: '2026-10-03T17:00:00Z' })],
          loadSaved: async () => bothSides,
          fetchMatch: pulling(fetched),
        }),
      );

      expect(fetched).toEqual([]);
      expect(record).toMatchObject({ source: 'saved', liveFailed: false, asOf: bothSides.generatedAt });
      expect(record.snapshot).toBe(bothSides);
    });

    it('skips postponed fixtures, which have nothing to fetch', async () => {
      const fetched: string[] = [];
      await loadClubRecord(
        club,
        deps({
          fixtures: [scheduled('moved', { status: 'Postponed' })],
          loadSaved: async () => bothSides,
          fetchMatch: pulling(fetched),
        }),
      );

      expect(fetched).toEqual([]);
    });

    it('fetches only fixtures with no result yet, however old, and adds them to the saved totals', async () => {
      const fetched: string[] = [];
      const record = await loadClubRecord(
        club,
        deps({
          // 'new' kicked off before the snapshot was written, but its result came later.
          fixtures: [scheduled('old', { dateTime: '2026-10-03T17:00:00Z' }), scheduled('new')],
          loadSaved: async () => bothSides,
          fetchMatch: pulling(fetched),
        }),
      );

      expect(fetched).toEqual(['new']);
      expect(record).toMatchObject({ source: 'live', asOf: NOW.toISOString() });
      expect(record.snapshot.rows.find((item) => item.playerId === 'sam')).toMatchObject({
        appearances: 3,
        played: 3,
        rounds: { old: 'Start', older: 'Start', new: 'Start' },
      });
      expect(record.snapshot.rows.find((item) => item.playerId === 'other')).toMatchObject({ played: 1 });
    });

    it('keeps saved gaps and adds new ones', async () => {
      const savedGap = {
        kind: 'no-lineup' as const,
        fixtureId: 'old',
        teamName: 'NOVA MD1',
        opponent: 'X',
        competition: 'MAC Men D1',
        dateTime: '2026-10-03T17:00:00Z',
      };
      const record = await loadClubRecord(
        club,
        deps({
          fixtures: [
            scheduled('new', {
              homeTeam: { name: 'NOVA MD1', score: '10' },
              awayTeam: { name: 'Rocky Gorge MD1', score: '5' },
            }),
          ],
          loadSaved: async () => ({ ...bothSides, gaps: [savedGap] }),
          fetchMatch: async () => null,
        }),
      );

      expect(record.snapshot.gaps.map((gap) => gap.fixtureId)).toContain('old');
      expect(record.snapshot.gaps.map((gap) => gap.fixtureId)).toContain('new');
    });

    it('pulls everything when the snapshot is from another season', async () => {
      const fetched: string[] = [];
      await loadClubRecord(
        club,
        deps({
          fixtures: [scheduled('old', { dateTime: '2026-10-03T17:00:00Z' })],
          loadSaved: async () => ({ ...bothSides, season: '2025/2026' }),
          fetchMatch: pulling(fetched),
        }),
      );

      expect(fetched).toEqual(['old']);
    });

    it('pulls everything when the snapshot is missing a side', async () => {
      const fetched: string[] = [];
      await loadClubRecord(
        club,
        deps({
          fixtures: [scheduled('old', { dateTime: '2026-10-03T17:00:00Z' })],
          loadSaved: async () => ({ ...bothSides, rows: [bothSides.rows[0]] }),
          fetchMatch: pulling(fetched),
        }),
      );

      expect(fetched).toEqual(['old']);
    });

    it('still pulls live when the snapshot cannot be loaded', async () => {
      const record = await loadClubRecord(
        club,
        deps({
          loadSaved: async () => {
            throw new Error('network');
          },
        }),
      );

      expect(record.source).toBe('live');
    });
  });

  it('uses only the saved snapshot outside live mode', async () => {
    const record = await loadClubRecord(
      club,
      deps({
        live: false,
        loadSaved: async () => saved,
        fetchMatch: async () => {
          throw new Error('should not fetch');
        },
      }),
    );

    expect(record).toMatchObject({ source: 'saved', liveFailed: false });
  });
});

describe('leagueResults', () => {
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

  it('keeps every side\'s played fixtures, in any competition or season, and nothing else', () => {
    const unscored = {
      homeTeam: { name: 'James River MD2', score: '' },
      awayTeam: { name: 'Raleigh MD2', score: '' },
    };
    const results = leagueResults(
      [
        scheduled('d2-result'),
        scheduled('women', { compName: 'Atlantic Women D1' }),
        scheduled('sevens', { compName: 'MAC 7s - Rites of Summer' }),
        scheduled('last-season', { season: '2025/2026', dateTime: '2025-10-17T17:00:00Z' }),
        scheduled('not-played', unscored),
        scheduled('upcoming-placeholder', { dateTime: '2026-11-14T17:00:00Z' }),
      ],
      NOW,
    );

    expect(results.map((fixture) => fixture.id)).toEqual(['d2-result', 'women', 'sevens', 'last-season']);
  });

  it('gives every side rows, and a gap when it has no lineup', () => {
    const [withLineup, withoutLineup] = leagueResults(
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
  const sides = { sides: [sideOf('Rocky Gorge MD1', 1), sideOf('Rocky Gorge MD3', 3)] };
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
    ).toEqual({ 'Rocky Gorge MD1': 2, 'Rocky Gorge MD3': 1 });
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
      ).toEqual({ 'Rocky Gorge MD1': 2, 'Rocky Gorge MD3': 1 });
    });

    it("don't count for a side that doesn't play in that division", () => {
      expect(
        remainingMatches(
          [played, unassigned({ compName: 'Capital Men D2' })],
          sides,
          baseConfig,
          NOW,
        ),
      ).toEqual({ 'Rocky Gorge MD1': 0, 'Rocky Gorge MD3': 0 });
    });

    it('count from a separate playoff competition for the same division', () => {
      expect(
        remainingMatches(
          [lowerPlayed, unassigned({ compName: 'Capital Men D3 Playoffs' })],
          sides,
          baseConfig,
          NOW,
        ),
      ).toEqual({ 'Rocky Gorge MD1': 0, 'Rocky Gorge MD3': 1 });
    });

    it('count when only one team has been assigned', () => {
      expect(
        remainingMatches(
          [played, unassigned({ homeTeam: { name: 'NOVA MD1', score: '' } })],
          sides,
          baseConfig,
          NOW,
        ),
      ).toEqual({ 'Rocky Gorge MD1': 1, 'Rocky Gorge MD3': 0 });
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
      ).toEqual({ 'Rocky Gorge MD1': 1, 'Rocky Gorge MD3': 0 });
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
      ).toEqual({ 'Rocky Gorge MD1': 0, 'Rocky Gorge MD3': 0 });
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
    ).toEqual({ 'Rocky Gorge MD1': 1, 'Rocky Gorge MD3': 0 });
  });
});

describe('playerRounds', () => {
  const NOW = new Date('2026-10-20T12:00:00Z');
  const fixture = (id: string, round: string, date: string, overrides: Record<string, unknown> = {}) => ({
    id,
    compName: 'Capital Men D3',
    season: SEASON,
    dateTime: `${date}T17:00:00Z`,
    round,
    status: 'Result',
    homeTeam: { name: 'Loudoun MD3', score: '20' },
    awayTeam: { name: 'Frederick MD3', score: '10' },
    ...overrides,
  });
  const rounds = (fixtures: ReturnType<typeof fixture>[], options: Partial<Parameters<typeof playerRounds>[0]> = {}) =>
    playerRounds({
      fixtures,
      teamName: 'Loudoun MD3',
      season: SEASON,
      rows: [
        row({
          teamName: 'Loudoun MD3',
          competition: 'Capital Men D3',
          rounds: { f1: 'Start', f2: 'Sub', f3: 'R' },
        }),
      ],
      gaps: [],
      resultIds: fixtures.map((item) => item.id),
      rules: baseConfig,
      now: NOW,
      ...options,
    });

  it("gives every round of the team's season in date order, whether or not the player appeared", () => {
    const result = rounds([
      fixture('f4', 'Round 4', '2026-10-10'),
      fixture('f1', 'Round 1', '2026-09-10'),
      fixture('f3', 'Round 3', '2026-09-30'),
      fixture('f2', 'Round 2', '2026-09-20'),
    ]);

    expect(result.map((item) => [item.round, item.status, item.counted])).toEqual([
      ['Round 1', 'started', true],
      ['Round 2', 'substitute', true],
      ['Round 3', 'unused', false],
      ['Round 4', 'not-listed', false],
    ]);
  });

  it('gives the opponent and score from the team\'s side, home or away', () => {
    const [home, away] = rounds([
      fixture('f1', 'Round 1', '2026-09-10'),
      fixture('f2', 'Round 2', '2026-09-20', {
        homeTeam: { name: 'NOVA MD3', score: '30' },
        awayTeam: { name: 'Loudoun MD3', score: '5' },
      }),
    ]);

    expect(home).toMatchObject({ fixtureId: 'f1', opponent: 'Frederick MD3', scoreFor: '20', scoreAgainst: '10' });
    expect(away).toMatchObject({ fixtureId: 'f2', opponent: 'NOVA MD3', scoreFor: '5', scoreAgainst: '30' });
  });

  it("leaves out other teams' fixtures and other seasons", () => {
    const result = rounds([
      fixture('other-team', 'Round 1', '2026-09-10', {
        homeTeam: { name: 'NOVA MD3', score: '1' },
        awayTeam: { name: 'Frederick MD3', score: '2' },
      }),
      fixture('last-season', 'Round 1', '2025-09-10', { season: '2025/2026' }),
    ]);

    expect(result).toEqual([]);
  });

  it('says why a round did not count', () => {
    const result = rounds(
      [
        fixture('forfeit', 'Round 1', '2026-09-10', { status: 'Forfeit' }),
        fixture('postponed', 'Round 2', '2026-09-20', { status: 'Postponed' }),
        fixture('no-lineup', 'Round 4', '2026-09-30'),
        fixture('awaiting', 'Round 5', '2026-10-10', {
          status: 'Fixture',
          homeTeam: { name: 'Loudoun MD3', score: '' },
          awayTeam: { name: 'Frederick MD3', score: '' },
        }),
        fixture('upcoming', 'Round 6', '2026-11-10', {
          status: 'Fixture',
          homeTeam: { name: 'Loudoun MD3', score: '' },
          awayTeam: { name: 'Frederick MD3', score: '' },
        }),
        fixture('sevens', 'Round 1', '2026-10-01', { compName: 'Capital 7s' }),
      ],
      {
        resultIds: ['forfeit', 'postponed', 'no-lineup', 'sevens'],
        gaps: [
          {
            kind: 'no-lineup',
            fixtureId: 'no-lineup',
            teamName: 'Loudoun MD3',
            opponent: 'Frederick MD3',
            competition: 'Capital Men D3',
            dateTime: '2026-09-30T17:00:00Z',
          },
        ],
      },
    );

    expect(Object.fromEntries(result.map((item) => [item.fixtureId, [item.status, item.counted]]))).toEqual({
      forfeit: ['forfeit', false],
      postponed: ['postponed', false],
      'no-lineup': ['no-lineup', false],
      sevens: ['not-qualifying', false],
      awaiting: ['awaiting-result', false],
      upcoming: ['upcoming', false],
    });
  });

  it('flags a round whose substitutions were not entered, so a reserve may really have played', () => {
    const [round] = rounds([fixture('f3', 'Round 3', '2026-09-30')], {
      gaps: [
        {
          kind: 'no-substitutions',
          fixtureId: 'f3',
          teamName: 'Loudoun MD3',
          opponent: 'Frederick MD3',
          competition: 'Capital Men D3',
          dateTime: '2026-09-30T17:00:00Z',
        },
      ],
    });

    expect(round).toMatchObject({ status: 'unused', substitutionsMissing: true });
  });

  it('labels a round with no name by its date', () => {
    const [round] = rounds([fixture('f1', '', '2026-09-10')]);

    expect(round.round).toBe('2026-09-10');
  });

  it('tells apart two fixtures with the same round name, using a real snapshot', () => {
    const results = [
      result('first', { dateTime: '2026-10-10T17:00:00Z', round: 'Round 4' }),
      result('second', { dateTime: '2026-10-17T17:00:00Z', round: 'Round 4' }),
    ];
    const snapshot = buildParticipationSnapshot(
      [history('sam', 'Sam Hooker', [game('first', { starter: false, played: false }), game('second')])],
      results,
      new Date('2026-10-20T12:00:00Z'),
    );

    const items = playerRounds({
      fixtures: results.map((item) => ({
        ...item,
        homeTeam: { name: item.homeTeam.name, score: '10' },
        awayTeam: { name: item.awayTeam.name, score: '5' },
      })),
      teamName: 'Rocky Gorge MD1',
      season: SEASON,
      rows: snapshot.rows,
      gaps: snapshot.gaps,
      resultIds: snapshot.resultIds ?? [],
      rules: baseConfig,
      now: NOW,
    });

    expect(items.map((item) => [item.fixtureId, item.status, item.counted])).toEqual([
      ['first', 'unused', false],
      ['second', 'started', true],
    ]);
    expect(snapshot.rows[0].played).toBe(1);
  });
});

describe('playerSeasonEligibility', () => {
  const NOW = new Date('2026-11-06T12:00:00Z');
  const schedule = (home: string, away: string, compName: string, date = '2026-10-10') => ({
    compName,
    dateTime: `${date}T17:00:00Z`,
    homeTeam: { name: home, score: '' },
    awayTeam: { name: away, score: '' },
  });
  const fixtures = [
    schedule('NOVA MD1', 'Washington MD1', 'MAC Men D1'),
    schedule('NOVA MD3', 'Loudoun MD3', 'Capital Men D3'),
  ];

  it('gives a verdict for each side of a two-side club, upper first', () => {
    const snapshot = snapshotOf([
      row({ playerId: 'sam', teamName: 'NOVA MD3', competition: 'Capital Men D3', played: 2 }),
      row({ playerId: 'other', teamName: 'NOVA MD1', played: 5 }),
    ]);

    const [result, ...others] = playerSeasonEligibility(snapshot, fixtures, 'sam', baseConfig, NOW);

    expect(others).toEqual([]);
    expect(result.club.name).toBe('NOVA');
    expect(result.verdicts.map((player) => [player.teamName, player.eligible, player.participation])).toEqual([
      ['NOVA MD1', true, 0],
      ['NOVA MD3', true, 2],
    ]);
  });

  it('gives one verdict for a player at a one-side club, and counts its remaining fixtures', () => {
    const snapshot = snapshotOf([
      row({ playerId: 'lee', teamName: 'Loudoun MD3', competition: 'Capital Men D3', played: 1 }),
    ]);
    const withUpcoming = [...fixtures, schedule('Loudoun MD3', 'Frederick MD3', 'Capital Men D3', '2026-11-20')];

    const [result] = playerSeasonEligibility(snapshot, withUpcoming, 'lee', baseConfig, NOW);

    expect(result.verdicts).toHaveLength(1);
    expect(result.verdicts[0]).toMatchObject({
      eligible: true,
      pending: ['Needs 1 more qualifying match (1 fixture left)'],
    });
  });

  it('gives nothing for a player with no qualifying rows this season', () => {
    const snapshot = snapshotOf([
      row({ playerId: 'sevens', teamName: 'NOVA MD1', competition: 'MAC 7s', played: 3 }),
    ]);

    expect(playerSeasonEligibility(snapshot, fixtures, 'sevens', baseConfig, NOW)).toEqual([]);
    expect(playerSeasonEligibility(snapshot, fixtures, 'nobody', baseConfig, NOW)).toEqual([]);
  });
});

describe('NCS Qualifying Matches', () => {
  it('leaves out crossovers, so a side playing only those is not listed', () => {
    const clubs = listClubs([fixtureOf('Philadelphia WD1', 'Severn River WD2', 'Capital Women D2-D1 Crossovers')], baseConfig);

    expect(clubs).toEqual([]);
  });
});

describe('possibleFixtures', () => {
  const NOW = new Date('2026-11-06T12:00:00Z');
  const club = { sides: [sideOf('NOVA MD1', 1), sideOf('NOVA MD3', 3)] };
  const fixture = (id: string, date: string, home: string, away: string, compName = 'Capital Men D3', overrides = {}) => ({
    id,
    compName,
    dateTime: `${date}T17:00:00Z`,
    homeTeam: { name: home, score: '' },
    awayTeam: { name: away, score: '' },
    ...overrides,
  });
  const fixtures = [
    fixture('later', '2026-12-05', 'Loudoun MD3', 'NOVA MD3'),
    fixture('soon', '2026-11-14', 'NOVA MD3', 'Frederick MD3'),
    fixture('played', '2026-10-10', 'NOVA MD3', 'Raleigh MD3'),
    fixture('playoff-a', '2027-03-20', '', '', 'Capital Men D3 Playoffs'),
    fixture('playoff-b', '2027-03-20', '', '', 'Capital Men D3 Playoffs'),
    fixture('forfeit', '2026-11-21', 'NOVA MD3', 'Roanoke MD3', 'Capital Men D3', { status: 'Forfeit' }),
    fixture('sevens', '2026-11-28', 'NOVA MD3', 'Roanoke MD3', 'Capital 7s'),
    fixture('other', '2026-11-28', 'Loudoun MD3', 'Frederick MD3'),
  ];

  it("lists a side's own fixtures with its opponent, then one open playoff per date, in date order", () => {
    const result = possibleFixtures(fixtures, club, baseConfig, NOW);

    expect(result['NOVA MD3'].map((item) => [item.fixtureId, item.opponent, item.open])).toEqual([
      ['soon', 'Frederick MD3', false],
      ['later', 'Loudoun MD3', false],
      ['playoff-a', '', true],
    ]);
    expect(result['NOVA MD1']).toEqual([]);
  });

  it('holds exactly the fixtures remainingMatches counts, so the list and the verdict agree', () => {
    const counts = remainingMatches(fixtures, club, baseConfig, NOW);
    const lists = possibleFixtures(fixtures, club, baseConfig, NOW);

    expect(counts).toEqual({ 'NOVA MD1': lists['NOVA MD1'].length, 'NOVA MD3': lists['NOVA MD3'].length });
    expect(counts).toEqual({ 'NOVA MD1': 0, 'NOVA MD3': 3 });
  });
});
