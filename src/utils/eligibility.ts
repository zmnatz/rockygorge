import { parseCsv } from '@/utils/csv';
import type {
  DivisionRole,
  DivisionSummary,
  EligibilityBreakdown,
  EligibilityConfig,
  PlayerEligibility,
  PlayerRow,
} from '@/types/eligibility';

const HEADER_COLUMNS = [
  'USA ID',
  'First Name',
  'Last Name',
  'Player Last Registered',
  'Team Name',
  'Competition',
  'Appearances',
  'Played',
  'Substitute',
] as const;

/** Parse a Rugby Xplorer "matches played" CSV export into PlayerRow records.
 *  The per-round attendance columns (Round 1..N) are kept for detail display;
 *  eligibility reads only the Played + Substitute totals. */
export function parsePlayerRows(csvText: string): PlayerRow[] {
  const rows = parseCsv(csvText);
  if (rows.length < 2) {
    throw new Error('The CSV contains a header but no player rows.');
  }

  const header = rows[0].map((cell) => cell.trim());
  const indexOf = (name: string) => {
    const at = header.indexOf(name);
    if (at === -1) {
      throw new Error(`The CSV is missing an expected column: "${name}"`);
    }
    return at;
  };

  const col = Object.fromEntries(
    HEADER_COLUMNS.map((name) => [name, indexOf(name)]),
  ) as Record<(typeof HEADER_COLUMNS)[number], number>;

  const ROUND_RE = /^Round \d+$/;
  const roundCols = header
    .map((name, index) => ({ name, index }))
    .filter(({ name }) => ROUND_RE.test(name));

  const asNumber = (value: string) => Number(value) || 0;

  return rows
    .slice(1)
    .filter((row) => row.some((cell) => cell.trim() !== ''))
    .map((row) => ({
      usaId: row[col['USA ID']].trim(),
      firstName: row[col['First Name']].trim(),
      lastName: row[col['Last Name']].trim(),
      lastRegistered: row[col['Player Last Registered']].trim(),
      teamName: row[col['Team Name']].trim(),
      competition: row[col.Competition].trim(),
      appearances: asNumber(row[col.Appearances]),
      played: asNumber(row[col.Played]),
      substitute: asNumber(row[col.Substitute]),
      rounds: Object.fromEntries(
        roundCols.map(({ name, index }) => [name, row[index]?.trim() ?? '']),
      ),
    }));
}

/** Match Participation for a team's rows — Played + Substitute (a player who
 *  stepped on the field as a starter or replacement). The per-round attendance
 *  codes do not count; see docs/adr/008-eligibility-rules.md. */
function participation(row: PlayerRow | undefined): number {
  if (!row) return 0;
  return row.played + row.substitute;
}

function teamRole(teamName: string, config: EligibilityConfig): DivisionRole | null {
  if (teamName === config.upperDivision.teamName) return 'upper';
  if (teamName === config.lowerDivision.teamName) return 'lower';
  return null;
}

function evaluate(
  row: PlayerRow,
  ownParticipation: number,
  otherParticipation: number,
  config: EligibilityConfig,
  sourceRows: PlayerRow[],
): PlayerEligibility {
  const role = teamRole(row.teamName, config);
  if (!role) throw new Error(`No division configured for team "${row.teamName}"`);

  const reasons: string[] = [];

  if (role === 'upper') {
    const total = ownParticipation + otherParticipation;
    if (total < config.upperDivision.minimumTotalMatches) {
      reasons.push(
        `Needs ${config.upperDivision.minimumTotalMatches} qualifying matches (has ${total})`,
      );
    }
  } else {
    if (ownParticipation < config.lowerDivision.minimumMatches) {
      reasons.push(
        `Needs ${config.lowerDivision.minimumMatches} ${config.lowerDivision.label} matches (has ${ownParticipation})`,
      );
    }
    if (otherParticipation >= config.lowerDivision.upperMatchLimit) {
      reasons.push(
        `Played ${otherParticipation} upper-division matches — playing ${config.lowerDivision.upperMatchLimit} forfeits lower-division eligibility`,
      );
    }
    if (
      config.lowerDivision.lowerAtLeastUpper &&
      ownParticipation < otherParticipation
    ) {
      reasons.push(
        `Upper-division participation (${otherParticipation}) exceeds ${config.lowerDivision.label} participation (${ownParticipation})`,
      );
    }
  }

  return {
    usaId: row.usaId,
    firstName: row.firstName,
    lastName: row.lastName,
    name: [row.firstName, row.lastName].filter(Boolean).join(' '),
    lastRegistered: row.lastRegistered,
    teamName: row.teamName,
    role,
    played: row.played,
    substitute: row.substitute,
    participation: ownParticipation,
    otherDivisionParticipation: otherParticipation,
    rows: sourceRows,
    eligible: reasons.length === 0,
    reasons,
  };
}

const byName = (a: PlayerEligibility, b: PlayerEligibility) =>
  a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName);

/** Resolve the display label for a division side: its single competition when
 *  the side spans exactly one, otherwise the configured team name (a side can
 *  span several competitions). Shared by the table tabs and the export report
 *  so the label can't drift between them. */
export function divisionLabel(
  label: string,
  teamName: string,
  summary: DivisionSummary,
): string {
  return summary.competitions.length === 1
    ? `${label} side — ${summary.competitions[0]}`
    : `${label} side — ${teamName}`;
}

/** Combine two rows for the same player on the same team, summing the match
 *  totals so participation reflects every competition the report lists. */
function combineRows(previous: PlayerRow, next: PlayerRow): PlayerRow {
  return {
    ...previous,
    appearances: previous.appearances + next.appearances,
    played: previous.played + next.played,
    substitute: previous.substitute + next.substitute,
  };
}

/** Compute per-division eligibility by joining each player's team rows on USA ID.
 *  Rows for the same player on the same team (one per competition) are combined
 *  into a single participation total; rows with no USA ID cannot be joined and
 *  are excluded. */
export function computeBreakdown(
  rows: PlayerRow[],
  config: EligibilityConfig,
): EligibilityBreakdown {
  /** A division's joined roster: players keyed by USA ID (rows across
   *  competitions combined), each player's raw CSV rows, and the
   *  competitions those rows span. */
  const team = (teamName: string) => {
    const map = new Map<string, PlayerRow>();
    const sources = new Map<string, PlayerRow[]>();
    const competitions = new Set<string>();
    for (const row of rows) {
      if (row.teamName !== teamName) continue;
      const key = row.usaId.trim();
      if (!key) continue;
      if (row.competition.trim() !== '') competitions.add(row.competition);
      const previous = map.get(key);
      map.set(key, previous ? combineRows(previous, row) : row);
      sources.set(key, [...(sources.get(key) ?? []), row]);
    }
    return { map, sources, competitions };
  };

  const upperTeam = team(config.upperDivision.teamName);
  const lowerTeam = team(config.lowerDivision.teamName);

  /** All of a player's CSV rows across every team, so the detail modal shows
   *  no matter which division table opened it. The player's own team first. */
  const sourcesFor = (row: PlayerRow): PlayerRow[] => {
    const upper = upperTeam.sources.get(row.usaId) ?? [];
    const lower = lowerTeam.sources.get(row.usaId) ?? [];
    return teamRole(row.teamName, config) === 'upper' ? [...upper, ...lower] : [...lower, ...upper];
  };

  const upper = [...upperTeam.map.values()].map((row) =>
    evaluate(
      row,
      participation(row),
      participation(lowerTeam.map.get(row.usaId.trim())),
      config,
      sourcesFor(row),
    ),
  );
  const lower = [...lowerTeam.map.values()].map((row) =>
    evaluate(
      row,
      participation(row),
      participation(upperTeam.map.get(row.usaId.trim())),
      config,
      sourcesFor(row),
    ),
  );

  upper.sort(byName);
  lower.sort(byName);

  const summarize = (players: PlayerEligibility[], competitions: Set<string>): DivisionSummary => ({
    total: players.length,
    eligible: players.filter((player) => player.eligible).length,
    competitions: [...competitions].sort(),
  });

  const ignoredTeamNames = [
    ...new Set(rows.map((row) => row.teamName).filter((name) => teamRole(name, config) === null)),
  ];

  return {
    upper,
    lower,
    upperSummary: summarize(upper, upperTeam.competitions),
    lowerSummary: summarize(lower, lowerTeam.competitions),
    ignoredTeamNames,
  };
}