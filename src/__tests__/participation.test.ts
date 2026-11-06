import { describe, expect, it } from 'vitest';
import { computeBreakdown } from '@/utils/eligibility';
import {
  buildParticipationSnapshot,
  clubConfig,
  clubGaps,
  listClubs,
  participationRows,
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
  it('totals starts, substitute appearances and unused reserves per team and competition', () => {
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
        appearances: 3,
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
  nonQualifyingCompetitions: ['National Championships', 'Super Regional', '7s'],
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

describe('listClubs', () => {
  it('lists clubs with two sides, ranked upper then lower, sorted by name', () => {
    const clubs = listClubs(
      snapshotOf([
        row({ teamName: 'Rocky Gorge MD3' }),
        row({ teamName: 'Rocky Gorge MD1' }),
        row({ teamName: 'James River MD2' }),
        row({ teamName: 'James River MD3' }),
      ]),
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

  it('leaves out clubs with one side, and clubs with three that the two-side rules do not cover', () => {
    const clubs = listClubs(
      snapshotOf([
        row({ teamName: 'Frederick MD3' }),
        row({ teamName: 'Severn River MD1' }),
        row({ teamName: 'Severn River MD3' }),
        row({ teamName: 'Severn River MD4' }),
      ]),
      baseConfig,
    );

    expect(clubs).toEqual([]);
  });

  it('keeps a club\'s men\'s and women\'s sides apart', () => {
    const clubs = listClubs(
      snapshotOf([row({ teamName: 'NOVA MD1' }), row({ teamName: 'NOVA WD3' })]),
      baseConfig,
    );

    expect(clubs).toEqual([]);
  });

  it('only counts sides that have qualifying matches', () => {
    const clubs = listClubs(
      snapshotOf([
        row({ teamName: 'Rocky Gorge MD1' }),
        row({ teamName: 'Rocky Gorge MD3', competition: 'Rocky Gorge 7s' }),
      ]),
      baseConfig,
    );

    expect(clubs).toEqual([]);
  });
});

describe('record-based eligibility', () => {
  const [club] = listClubs(
    snapshotOf([row({ teamName: 'NOVA MD1' }), row({ teamName: 'NOVA MD3' })]),
    baseConfig,
  );

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

  it('does not count non-qualifying competitions towards participation', () => {
    const config = clubConfig(club, baseConfig);
    const snapshot = snapshotOf([
      row({ teamName: 'NOVA MD1', played: 1 }),
      row({ teamName: 'NOVA MD1', competition: '2027 National Championships', played: 1 }),
      row({ teamName: 'NOVA MD1', competition: '2027 Super Regional Atlantic', played: 1 }),
      row({ teamName: 'NOVA MD1', competition: 'MAC 7s - Rites of Summer', played: 1 }),
    ]);

    const breakdown = computeBreakdown(participationRows(snapshot, club, config), config);

    expect(breakdown.upper[0].participation).toBe(1);
    expect(breakdown.upper[0].eligible).toBe(false);
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
        gap('NOVA MD3', '2027 National Championships'),
      ],
    };

    expect(clubGaps(snapshot, club, config).map((item) => item.teamName)).toEqual(['NOVA MD1']);
  });
});
