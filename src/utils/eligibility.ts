import { parseCsv } from '@/utils/csv';
import type {
  DivisionRole,
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
  'Player Rego Active',
  'Team Name',
  'Competition',
  'Appearances',
  'Played',
  'Reserve',
  'Substitute',
] as const;

/** Parse a Rugby Xplorer "matches played" CSV export into PlayerRow records.
 *  Per-round attendance columns are ignored; only the totals are read. */
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

  const asNumber = (value: string) => Number(value) || 0;

  return rows
    .slice(1)
    .filter((row) => row.some((cell) => cell.trim() !== ''))
    .map((row) => ({
      usaId: row[col['USA ID']].trim(),
      firstName: row[col['First Name']].trim(),
      lastName: row[col['Last Name']].trim(),
      lastRegistered: row[col['Player Last Registered']].trim(),
      regoActive: row[col['Player Rego Active']].trim() === 'Yes',
      teamName: row[col['Team Name']].trim(),
      competition: row[col.Competition].trim(),
      appearances: asNumber(row[col.Appearances]),
      played: asNumber(row[col.Played]),
      reserve: asNumber(row[col.Reserve]),
      substitute: asNumber(row[col.Substitute]),
    }));
}

/** Match Participation for a team's rows — Played + Substitute (a player who
 *  stepped on the field as a starter or replacement). Reserve and the
 *  per-round columns do not count; see docs/adr/008-eligibility-rules.md. */
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
    competition: row.competition,
    role,
    played: row.played,
    reserve: row.reserve,
    substitute: row.substitute,
    participation: ownParticipation,
    otherDivisionParticipation: otherParticipation,
    eligible: reasons.length === 0,
    reasons,
  };
}

const byName = (a: PlayerEligibility, b: PlayerEligibility) =>
  a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName);

/** Compute per-division eligibility by joining each player's team rows on USA ID. */
export function computeBreakdown(
  rows: PlayerRow[],
  config: EligibilityConfig,
): EligibilityBreakdown {
  const byId = (teamName: string) => {
    const map = new Map<string, PlayerRow>();
    for (const row of rows) {
      if (row.teamName !== teamName) continue;
      const key = row.usaId.trim();
      if (key && !map.has(key)) map.set(key, row);
    }
    return map;
  };

  const upperRows = byId(config.upperDivision.teamName);
  const lowerRows = byId(config.lowerDivision.teamName);

  const build = (
    row: PlayerRow,
    own: number,
    other: number,
  ) => evaluate(row, own, other, config);

  const upper = [...upperRows.values()].map((row) =>
    build(row, participation(row), participation(lowerRows.get(row.usaId.trim()))),
  );
  const lower = [...lowerRows.values()].map((row) =>
    build(row, participation(row), participation(upperRows.get(row.usaId.trim()))),
  );

  upper.sort(byName);
  lower.sort(byName);

  const summarize = (players: PlayerEligibility[]) => ({
    total: players.length,
    eligible: players.filter((player) => player.eligible).length,
  });

  const ignoredTeamNames = [
    ...new Set(rows.map((row) => row.teamName).filter((name) => teamRole(name, config) === null)),
  ];

  return {
    upper,
    lower,
    upperSummary: summarize(upper),
    lowerSummary: summarize(lower),
    ignoredTeamNames,
  };
}