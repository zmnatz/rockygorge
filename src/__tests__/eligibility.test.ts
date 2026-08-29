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
};

const SAMPLE_CSV = [
  HEADER_CSV,
  '"2019013","Matthew","Burns","Aug 27, 2026 MDT","Yes","Rocky Gorge Rugby","Rocky Gorge MD3","Capital Men D3","0","0","0","0","","","","","","","","","","","","",""',
  '"2019013","Matthew","Burns","Aug 27, 2026 MDT","Yes","Rocky Gorge Rugby","Rocky Gorge MD1","MAC Men D1","0","0","0","0","","","","","","","","",""',
  '"2164744","Nicolas","Capobianco","NA","NA","Rocky Gorge Rugby","Rocky Gorge MD3","Capital Men D3","0","0","0","0","","","","","","","","","","","","",""',
  '"2164744","Nicolas","Capobianco","NA","NA","Rocky Gorge Rugby","Rocky Gorge MD1","MAC Men D1","0","0","0","0","","","","","","","","",""',
].join('\n');

const row = (overrides: Record<string, string | number>) => ({
  usaId: '100',
  firstName: 'Jane',
  lastName: 'Doe',
  lastRegistered: 'Aug 1, 2026 MDT',
  regoActive: true,
  teamName: 'Rocky Gorge MD3',
  competition: 'Capital Men D3',
  appearances: 0,
  played: 0,
  reserve: 0,
  substitute: 0,
  ...overrides,
});

describe('parsePlayerRows', () => {
  it('parses the sample export into PlayerRow records', () => {
    const rows = parsePlayerRows(SAMPLE_CSV);
    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({
      usaId: '2019013',
      firstName: 'Matthew',
      lastName: 'Burns',
      lastRegistered: 'Aug 27, 2026 MDT',
      regoActive: true,
      teamName: 'Rocky Gorge MD3',
      competition: 'Capital Men D3',
      played: 0,
    });
    expect(rows[2]).toMatchObject({ usaId: '2164744', regoActive: false });
  });

  it('reads numeric totals from Played / Reserve / Substitute', () => {
    const csv =
      HEADER_CSV +
      '\n"1","A","B","NA","Yes","Club","Rocky Gorge MD1","MAC Men D1","4","2","1","1","",""';
    const [parsed] = parsePlayerRows(csv);
    expect(parsed).toMatchObject({ appearances: 4, played: 2, reserve: 1, substitute: 1 });
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
    expect(breakdown.upperSummary).toEqual({ total: 2, eligible: 0 });
    expect(breakdown.lowerSummary).toEqual({ total: 2, eligible: 0 });

    const burns = breakdown.upper[0];
    expect(burns.name).toBe('Matthew Burns');
    expect(burns.eligible).toBe(false);
    expect(burns.reasons.some((r) => r.includes('Needs 2 qualifying matches'))).toBe(true);
  });

  it('excludes players with no active registration', () => {
    const breakdown = computeBreakdown(parsePlayerRows(SAMPLE_CSV), config);
    const capobianco = breakdown.lower.find((p) => p.lastName === 'Capobianco');
    expect(capobianco?.eligible).toBe(false);
    expect(capobianco?.reasons.some((r) => r.includes('Not registered'))).toBe(true);
  });

  it('declares a D3 player with 2 matches eligible for both divisions', () => {
    const rows = [
      row({ usaId: '1', teamName: 'Rocky Gorge MD3', played: 2, appearances: 2 }),
      row({ usaId: '1', teamName: 'Rocky Gorge MD1', played: 0 }),
    ];
    const breakdown = computeBreakdown(rows, config);
    const d3 = breakdown.lower.find((p) => p.usaId === '1');
    const d1 = breakdown.upper.find((p) => p.usaId === '1');
    expect(d3?.eligible).toBe(true);
    expect(d1?.eligible).toBe(true);
  });

  it('declares an upper-heavy player ineligible for the lower division', () => {
    const rows = [
      row({ usaId: '1', teamName: 'Rocky Gorge MD1', played: 3, appearances: 3 }),
      row({ usaId: '1', teamName: 'Rocky Gorge MD3', played: 1, appearances: 1 }),
    ];
    const breakdown = computeBreakdown(rows, config);
    expect(breakdown.upper[0].eligible).toBe(true);
    expect(breakdown.lower[0].eligible).toBe(false);
    expect(breakdown.lower[0].reasons.some((r) => r.includes('Needs 2 D3 matches'))).toBe(true);
    expect(breakdown.lower[0].reasons.some((r) => r.includes('exceeds'))).toBe(true);
  });

  it('forfeits lower-division eligibility on a fourth upper-division match', () => {
    const rows = [
      row({ usaId: '1', teamName: 'Rocky Gorge MD1', played: 4, appearances: 4 }),
      row({ usaId: '1', teamName: 'Rocky Gorge MD3', played: 5, appearances: 5 }),
    ];
    const breakdown = computeBreakdown(rows, config);
    expect(breakdown.upper[0].eligible).toBe(true);
    expect(breakdown.lower[0].eligible).toBe(false);
    expect(breakdown.lower[0].reasons.some((r) => r.includes('forfeits'))).toBe(true);
  });

  it('counts substitute appearances toward participation', () => {
    const rows = [
      row({ usaId: '1', teamName: 'Rocky Gorge MD3', substitute: 2, appearances: 2 }),
      row({ usaId: '1', teamName: 'Rocky Gorge MD1' }),
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
});