import { describe, expect, it } from 'vitest';
import { parsePlayerRows, computeBreakdown } from '@/utils/eligibility';
import type { EligibilityConfig } from '@/types/eligibility';

const HEADER_CSV = `"USA ID","First Name","Last Name","Player Last Registered","Player Rego Active","Club Name","Team Name","Competition","Appearances","Played","Reserve","Substitute","Round 1","Round 2","Round 3","Round 4","Round 5","Round 6","Round 7","Round 8","Round 9","Round 10","Round 11","Round 12","Round 13"`;

const config: EligibilityConfig = {
  upperDivision: {
    teamName: 'Rocky Gorge MD1',
    label: 'D1',
    minimumTotalMatches: 2,
  },
  lowerDivision: {
    teamName: 'Rocky Gorge MD3',
    label: 'D3',
    minimumMatches: 2,
    upperMatchLimit: 4,
    lowerAtLeastUpper: true,
  },
  nonQualifyingCompetitions: [],
};

const SAMPLE_CSV = [
  HEADER_CSV,
  '"2019013","Matthew","Burns","Aug 27, 2026 MDT","Yes","Rocky Gorge Rugby","Rocky Gorge MD3","Capital Men D3","0","0","0","0","","","","","","","","","","","","",""',
  '"2019013","Matthew","Burns","Aug 27, 2026 MDT","Yes","Rocky Gorge Rugby","Rocky Gorge MD1","MAC Men D1","0","0","0","0","","","","","","","","",""',
  '"2164744","Nicolas","Capobianco","NA","NA","Rocky Gorge Rugby","Rocky Gorge MD3","Capital Men D3","0","0","0","0","","","","","","","","","","","","",""',
  '"2164744","Nicolas","Capobianco","NA","NA","Rocky Gorge Rugby","Rocky Gorge MD1","MAC Men D1","0","0","0","0","","","","","","","","",""',
].join('\n');

const row = (overrides: Record<string, string | number | boolean>) => ({
  playerId: '100',
  firstName: 'Jane',
  lastName: 'Doe',
  lastRegistered: 'Aug 1, 2026 MDT',
  teamName: 'Rocky Gorge MD3',
  competition: 'Capital Men D3',
  appearances: 0,
  played: 0,
  substitute: 0,
  rounds: {},
  ...overrides,
});

describe('parsePlayerRows', () => {
  it('parses the sample export into PlayerRow records', () => {
    const rows = parsePlayerRows(SAMPLE_CSV);
    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({
      playerId: '2019013',
      firstName: 'Matthew',
      lastName: 'Burns',
      lastRegistered: 'Aug 27, 2026 MDT',
      teamName: 'Rocky Gorge MD3',
      competition: 'Capital Men D3',
      played: 0,
    });
  });

  it('reads numeric totals from Played and Substitute', () => {
    const csv =
      HEADER_CSV +
      '\n"1","A","B","NA","Yes","Club","Rocky Gorge MD1","MAC Men D1","4","2","1","1","",""';
    const [parsed] = parsePlayerRows(csv);
    expect(parsed).toMatchObject({ appearances: 4, played: 2, substitute: 1 });
  });

  it('keeps the per-round attendance codes for detail display', () => {
    const data = ['1', 'A', 'B', 'NA', 'Yes', 'Club', 'Rocky Gorge MD1', 'MAC Men D1', '3', '1', '0', '1', 'S', 'R', 'S'];
    const csv = `${HEADER_CSV}\n${data.map((value) => `"${value}"`).join(',')}`;
    const [parsed] = parsePlayerRows(csv);
    expect(parsed.rounds).toMatchObject({ 'Round 1': 'S', 'Round 2': 'R', 'Round 3': 'S' });
  });

  it('throws when a required column is missing', () => {
    expect(() => parsePlayerRows('"USA ID","Name"\n"1","A"')).toThrow(/missing an expected column: "First Name"/i);
  });

  it('throws when there is no data row', () => {
    expect(() => parsePlayerRows(HEADER_CSV)).toThrow(/no player rows/i);
  });
});

describe('computeBreakdown', () => {
  it('marks 0-appearance players ineligible with the participation reason', () => {
    const breakdown = computeBreakdown(parsePlayerRows(SAMPLE_CSV), config);
    expect(breakdown.upperSummary).toEqual({ total: 2, eligible: 0, onTrack: 0, competitions: ['MAC Men D1'] });
    expect(breakdown.lowerSummary).toEqual({ total: 2, eligible: 0, onTrack: 0, competitions: ['Capital Men D3'] });

    const burns = breakdown.upper[0];
    expect(burns.name).toBe('Matthew Burns');
    expect(burns.eligible).toBe(false);
    expect(burns.reasons.some((r) => r.includes('Needs 2 qualifying matches'))).toBe(true);
  });

  it('ignores registration status — the report only lists registered players', () => {
    const rows = [
      row({ playerId: '1', teamName: 'Rocky Gorge MD3', played: 2, appearances: 2 }),
      row({ playerId: '1', teamName: 'Rocky Gorge MD1' }),
    ];
    const breakdown = computeBreakdown(rows, config);
    const d3 = breakdown.lower.find((p) => p.playerId === '1');
    const d1 = breakdown.upper.find((p) => p.playerId === '1');
    expect(d3?.reasons).toEqual([]);
    expect(d3?.eligible).toBe(true);
    expect(d1?.eligible).toBe(true);
  });

  it('declares a D3 player with 2 matches eligible for both divisions', () => {
    const rows = [
      row({ playerId: '1', teamName: 'Rocky Gorge MD3', played: 2, appearances: 2 }),
      row({ playerId: '1', teamName: 'Rocky Gorge MD1', played: 0 }),
    ];
    const breakdown = computeBreakdown(rows, config);
    const d3 = breakdown.lower.find((p) => p.playerId === '1');
    const d1 = breakdown.upper.find((p) => p.playerId === '1');
    expect(d3?.eligible).toBe(true);
    expect(d1?.eligible).toBe(true);
  });

  it('declares an upper-heavy player ineligible for the lower division', () => {
    const rows = [
      row({ playerId: '1', teamName: 'Rocky Gorge MD1', played: 3, appearances: 3 }),
      row({ playerId: '1', teamName: 'Rocky Gorge MD3', played: 1, appearances: 1 }),
    ];
    const breakdown = computeBreakdown(rows, config);
    expect(breakdown.upper[0].eligible).toBe(true);
    expect(breakdown.lower[0].eligible).toBe(false);
    expect(breakdown.lower[0].reasons.some((r) => r.includes('Needs 2 D3 matches'))).toBe(true);
    expect(breakdown.lower[0].reasons.some((r) => r.includes('exceeds'))).toBe(true);
  });

  it('forfeits lower-division eligibility on a fourth upper-division match', () => {
    const rows = [
      row({ playerId: '1', teamName: 'Rocky Gorge MD1', played: 4, appearances: 4 }),
      row({ playerId: '1', teamName: 'Rocky Gorge MD3', played: 5, appearances: 5 }),
    ];
    const breakdown = computeBreakdown(rows, config);
    expect(breakdown.upper[0].eligible).toBe(true);
    expect(breakdown.lower[0].eligible).toBe(false);
    expect(breakdown.lower[0].reasons.some((r) => r.includes('forfeits'))).toBe(true);
  });

  it('counts substitute appearances toward participation', () => {
    const rows = [
      row({ playerId: '1', teamName: 'Rocky Gorge MD3', substitute: 2, appearances: 2 }),
      row({ playerId: '1', teamName: 'Rocky Gorge MD1' }),
    ];
    const breakdown = computeBreakdown(rows, config);
    expect(breakdown.lower[0].participation).toBe(2);
    expect(breakdown.lower[0].eligible).toBe(true);
  });

  it('collects team names that map to neither division', () => {
    const rows = [row({ teamName: 'Rocky Gorge MD2' })];
    const breakdown = computeBreakdown(rows, config);
    expect(breakdown.ignoredTeamNames).toEqual(['Rocky Gorge MD2']);
    expect(breakdown.upper).toHaveLength(0);
    expect(breakdown.lower).toHaveLength(0);
  });

  it('combines same-team rows across competitions into one participation total', () => {
    const rows = [
      row({ playerId: '1', teamName: 'Rocky Gorge MD3', competition: 'Capital Men D3', played: 1, appearances: 1 }),
      row({ playerId: '1', teamName: 'Rocky Gorge MD3', competition: 'Capital Men D3 Cup', played: 1, appearances: 1 }),
      row({ playerId: '1', teamName: 'Rocky Gorge MD1', competition: 'MAC Men D1' }),
    ];
    const breakdown = computeBreakdown(rows, config);
    const d3 = breakdown.lower.find((p) => p.playerId === '1');
    expect(breakdown.lower).toHaveLength(1);
    expect(d3?.played).toBe(2);
    expect(d3?.participation).toBe(2);
    expect(d3?.eligible).toBe(true);
    expect(breakdown.lowerSummary.competitions).toEqual(['Capital Men D3', 'Capital Men D3 Cup']);
  });

  it('sums cross-competition upper-division rows toward the D1 minimum', () => {
    const rows = [
      row({ playerId: '1', teamName: 'Rocky Gorge MD1', competition: 'MAC Men D1', played: 1, appearances: 1 }),
      row({ playerId: '1', teamName: 'Rocky Gorge MD1', competition: 'MAC Men D1 Cup', played: 1, appearances: 1 }),
    ];
    const breakdown = computeBreakdown(rows, config);
    expect(breakdown.upper).toHaveLength(1);
    expect(breakdown.upper[0].participation).toBe(2);
    expect(breakdown.upper[0].eligible).toBe(true);
    expect(breakdown.upperSummary.competitions).toEqual(['MAC Men D1', 'MAC Men D1 Cup']);
  });

  it('counts combined other-division rows when joining across teams', () => {
    const rows = [
      row({ playerId: '1', teamName: 'Rocky Gorge MD3', played: 2, appearances: 2 }),
      row({ playerId: '1', teamName: 'Rocky Gorge MD1', competition: 'MAC Men D1', played: 2, appearances: 2 }),
      row({ playerId: '1', teamName: 'Rocky Gorge MD1', competition: 'MAC Men D1 Cup', played: 1, appearances: 1 }),
    ];
    const breakdown = computeBreakdown(rows, config);
    const lower = breakdown.lower.find((p) => p.playerId === '1');
    expect(lower?.otherDivisionParticipation).toBe(3);
    expect(lower?.eligible).toBe(false);
    expect(lower?.reasons.some((r) => r.includes('exceeds'))).toBe(true);
  });

  it('carries the raw CSV rows for the detail modal', () => {
    const rows = [
      row({ playerId: '1', teamName: 'Rocky Gorge MD3', competition: 'Capital Men D3', played: 1, appearances: 1 }),
      row({ playerId: '1', teamName: 'Rocky Gorge MD3', competition: 'Capital Men D3 Cup', played: 1, appearances: 1 }),
    ];
    const breakdown = computeBreakdown(rows, config);
    const player = breakdown.lower[0];
    expect(player.rows).toHaveLength(2);
    expect(player.rows.map((source) => source.competition)).toEqual(['Capital Men D3', 'Capital Men D3 Cup']);
    expect(player.participation).toBe(2);
  });

  it('shows all of a cross-division player\'s competitions in the modal', () => {
    const rows = [
      row({ playerId: '7', teamName: 'Rocky Gorge MD3', competition: 'Capital Men D3', played: 1, appearances: 1 }),
      row({ playerId: '7', teamName: 'Rocky Gorge MD3', competition: 'Capital Men D3 Cup', played: 1, appearances: 1 }),
      row({ playerId: '7', teamName: 'Rocky Gorge MD1', competition: 'MAC Men D1', played: 1, appearances: 1 }),
    ];
    const breakdown = computeBreakdown(rows, config);
    const lower = breakdown.lower.find((p) => p.playerId === '7');
    const upper = breakdown.upper.find((p) => p.playerId === '7');
    expect(lower?.rows.map((source) => source.competition)).toEqual([
      'Capital Men D3',
      'Capital Men D3 Cup',
      'MAC Men D1',
    ]);
    expect(upper?.rows.map((source) => source.competition)).toEqual([
      'MAC Men D1',
      'Capital Men D3',
      'Capital Men D3 Cup',
    ]);
  });

  it('excludes rows without a USA ID', () => {
    const rows = [
      row({ playerId: '', teamName: 'Rocky Gorge MD3', played: 2, appearances: 2 }),
      row({ playerId: '100', teamName: 'Rocky Gorge MD3', played: 2, appearances: 2 }),
    ];
    const breakdown = computeBreakdown(rows, config);
    expect(breakdown.lower).toHaveLength(1);
    expect(breakdown.lower[0].playerId).toBe('100');
    expect(breakdown.lowerSummary.total).toBe(1);
  });
});

describe('computeBreakdown with fixtures still to play', () => {
  const players = [
    row({ playerId: 'one-lower', teamName: 'Rocky Gorge MD3', played: 1 }),
    row({ playerId: 'one-upper', teamName: 'Rocky Gorge MD1', competition: 'MAC Men D1', played: 1 }),
  ];
  const verdict = (list: { playerId: string }[], id: string) =>
    list.find((player) => player.playerId === id);

  it('keeps a player eligible and on track when remaining fixtures can reach the upper minimum', () => {
    const { upper } = computeBreakdown(players, config, { upper: 1, lower: 0 });

    expect(verdict(upper, 'one-upper')).toMatchObject({
      eligible: true,
      reasons: [],
      pending: ['Needs 1 more qualifying match (1 fixture left)'],
    });
  });

  it('counts fixtures on either side towards the upper minimum', () => {
    const { upper } = computeBreakdown(players, config, { upper: 0, lower: 1 });

    expect(verdict(upper, 'one-upper')).toMatchObject({ eligible: true });
  });

  it('counts only lower-division fixtures towards the lower minimum', () => {
    const { lower: upperOnly } = computeBreakdown(players, config, { upper: 5, lower: 0 });
    const { lower: withLower } = computeBreakdown(players, config, { upper: 0, lower: 1 });

    expect(verdict(upperOnly, 'one-lower')).toMatchObject({
      eligible: false,
      reasons: ['Needs 2 D3 matches (has 1)'],
      pending: [],
    });
    expect(verdict(withLower, 'one-lower')).toMatchObject({
      eligible: true,
      pending: ['Needs 1 more D3 match (1 fixture left)'],
    });
  });

  it('fails a player when too few fixtures remain to reach the minimum', () => {
    const noMatches = [row({ playerId: 'none', teamName: 'Rocky Gorge MD1', competition: 'MAC Men D1' })];
    const { upper } = computeBreakdown(noMatches, config, { upper: 1, lower: 0 });

    expect(verdict(upper, 'none')).toMatchObject({
      eligible: false,
      reasons: ['Needs 2 qualifying matches (has 0)'],
    });
  });

  it('does not let remaining fixtures excuse the other lower-division checks', () => {
    const overUpper = [
      row({ playerId: 'p', teamName: 'Rocky Gorge MD3', played: 1 }),
      row({ playerId: 'p', teamName: 'Rocky Gorge MD1', competition: 'MAC Men D1', played: 3 }),
    ];
    const { lower } = computeBreakdown(overUpper, config, { upper: 0, lower: 5 });

    expect(lower[0].eligible).toBe(false);
    expect(lower[0].reasons).toEqual(['Upper-division participation (3) exceeds D3 participation (1)']);
  });

  it('counts on-track players in the summary', () => {
    const { upperSummary } = computeBreakdown(players, config, { upper: 1, lower: 0 });

    expect(upperSummary).toMatchObject({ total: 1, eligible: 1, onTrack: 1 });
  });
});
