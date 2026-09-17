import { isResult, type CapitalFixture } from '@/api/capital';
import { isPlaceholderCrest, teamAbbreviation } from './crest';

export { teamAbbreviation };

export type Outcome = 'W' | 'L' | 'D';

export interface TeamRecord {
  played: number;
  won: number;
  lost: number;
  drawn: number;
  pointsFor: number;
  pointsAgainst: number;
}

export interface Streak {
  code: Outcome;
  count: number;
}

function parseScore(value: string): number {
  return parseInt(value || '0', 10);
}

// Which side of the fixture the team played on, or null if not involved.
export function teamSide(
  fixture: CapitalFixture,
  teamName: string
): 'home' | 'away' | null {
  if (fixture.homeTeam?.name === teamName) {
    return 'home';
  }
  if (fixture.awayTeam?.name === teamName) {
    return 'away';
  }
  return null;
}

// Result from the team's perspective, or null when the game has no score
// yet or the team is not in it.
export function outcomeOf(
  fixture: CapitalFixture,
  teamName: string
): Outcome | null {
  const side = teamSide(fixture, teamName);
  if (!side || !isResult(fixture)) {
    return null;
  }
  const own = parseScore(
    side === 'home' ? fixture.homeTeam.score : fixture.awayTeam.score
  );
  const other = parseScore(
    side === 'home' ? fixture.awayTeam.score : fixture.homeTeam.score
  );
  if (own > other) {
    return 'W';
  }
  if (own < other) {
    return 'L';
  }
  return 'D';
}

export function teamRecord(
  fixtures: CapitalFixture[],
  teamName: string
): TeamRecord {
  const record: TeamRecord = {
    played: 0,
    won: 0,
    lost: 0,
    drawn: 0,
    pointsFor: 0,
    pointsAgainst: 0,
  };
  for (const fixture of fixtures) {
    const outcome = outcomeOf(fixture, teamName);
    if (!outcome) {
      continue;
    }
    const side = teamSide(fixture, teamName);
    const own = parseScore(
      side === 'home' ? fixture.homeTeam.score : fixture.awayTeam.score
    );
    const other = parseScore(
      side === 'home' ? fixture.awayTeam.score : fixture.homeTeam.score
    );
    record.played += 1;
    record.pointsFor += own;
    record.pointsAgainst += other;
    if (outcome === 'W') {
      record.won += 1;
    } else if (outcome === 'L') {
      record.lost += 1;
    } else {
      record.drawn += 1;
    }
  }
  return record;
}

// Completed games involving the team, newest first.
export function teamResults(
  fixtures: CapitalFixture[],
  teamName: string
): CapitalFixture[] {
  return fixtures
    .filter((fixture) => teamSide(fixture, teamName) && isResult(fixture))
    .sort(
      (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
    );
}

// Current streak from the most recent results (a draw ends a W/L run).
export function teamStreak(
  fixtures: CapitalFixture[],
  teamName: string
): Streak | null {
  const results = teamResults(fixtures, teamName);
  if (results.length === 0) {
    return null;
  }
  const code = outcomeOf(results[0], teamName);
  if (!code) {
    return null;
  }
  let count = 0;
  for (const fixture of results) {
    if (outcomeOf(fixture, teamName) !== code) {
      break;
    }
    count += 1;
  }
  return { code, count };
}

// Most recent outcomes, newest first, capped at five.
export function lastFive(fixtures: CapitalFixture[], teamName: string): Outcome[] {
  const outcomes: Outcome[] = [];
  for (const fixture of teamResults(fixtures, teamName)) {
    const outcome = outcomeOf(fixture, teamName);
    if (outcome) {
      outcomes.push(outcome);
    }
    if (outcomes.length >= 5) {
      break;
    }
  }
  return outcomes;
}

// NFL-style win percentage: draws count as half a win. Null when unplayed.
export function winPct(record: Pick<TeamRecord, 'played' | 'won' | 'drawn'>): number | null {
  if (record.played === 0) {
    return null;
  }
  return (record.won + record.drawn * 0.5) / record.played;
}

// NFL-style formatting: ".625", "1.000", ".000", "–" when unplayed.
export function formatPct(value: number | null): string {
  if (value === null) {
    return '–';
  }
  return value.toFixed(3).replace(/^0/, '');
}

export function formatStreak(streak: Streak | null): string {
  if (!streak) {
    return '–';
  }
  return `${streak.code}${streak.count}`;
}

// First real crest seen for the team across the fixtures, or empty string.
// Generic CMS placeholders are skipped so callers can fall back to initials
// avatars instead.
export function teamCrest(fixtures: CapitalFixture[], teamName: string): string {
  for (const fixture of fixtures) {
    if (
      fixture.homeTeam?.name === teamName &&
      fixture.homeTeam.crest &&
      !isPlaceholderCrest(fixture.homeTeam.crest)
    ) {
      return fixture.homeTeam.crest;
    }
    if (
      fixture.awayTeam?.name === teamName &&
      fixture.awayTeam.crest &&
      !isPlaceholderCrest(fixture.awayTeam.crest)
    ) {
      return fixture.awayTeam.crest;
    }
  }
  return '';
}

export interface GameSpotlight {
  fixture: CapitalFixture;
  value: number;
}

export interface SeasonSummary {
  games: number;
  totalPoints: number;
  avgPoints: number;
  shutouts: number;
  biggestWin: GameSpotlight | null;
  highestScoring: GameSpotlight | null;
}

// League-wide numbers from completed games: totals, averages, shutouts,
// biggest margin and highest combined score.
export function seasonSummary(results: CapitalFixture[]): SeasonSummary {
  let totalPoints = 0;
  let shutouts = 0;
  let biggestWin: GameSpotlight | null = null;
  let highestScoring: GameSpotlight | null = null;
  for (const fixture of results) {
    const home = parseScore(fixture.homeTeam.score);
    const away = parseScore(fixture.awayTeam.score);
    totalPoints += home + away;
    if (home === 0 || away === 0) {
      shutouts += 1;
    }
    const margin = Math.abs(home - away);
    if (!biggestWin || margin > biggestWin.value) {
      biggestWin = { fixture, value: margin };
    }
    if (!highestScoring || home + away > highestScoring.value) {
      highestScoring = { fixture, value: home + away };
    }
  }
  return {
    games: results.length,
    totalPoints,
    avgPoints: results.length === 0 ? 0 : totalPoints / results.length,
    shutouts,
    biggestWin,
    highestScoring,
  };
}

export interface TeamStreakEntry {
  team: string;
  code: Outcome;
  count: number;
}

// Best single win run any team put together in the set.
export function longestWinStreak(results: CapitalFixture[]): TeamStreakEntry | null {
  const teams = new Set<string>();
  for (const fixture of results) {
    teams.add(fixture.homeTeam.name);
    teams.add(fixture.awayTeam.name);
  }
  let best: TeamStreakEntry | null = null;
  for (const team of teams) {
    const ordered = teamResults(results, team).reverse();
    let run = 0;
    for (const fixture of ordered) {
      if (outcomeOf(fixture, team) === 'W') {
        run += 1;
        if (!best || run > best.count) {
          best = { team, code: 'W', count: run };
        }
      } else {
        run = 0;
      }
    }
  }
  return best;
}

// Current streaks worth showing, longest first.
export function activeStreaks(
  results: CapitalFixture[],
  limit = 3
): TeamStreakEntry[] {
  const teams = new Set<string>();
  for (const fixture of results) {
    teams.add(fixture.homeTeam.name);
    teams.add(fixture.awayTeam.name);
  }
  return [...teams]
    .flatMap((team) => {
      const streak = teamStreak(results, team);
      return streak ? [{ team, ...streak }] : [];
    })
    .sort((a, b) => b.count - a.count || a.team.localeCompare(b.team))
    .slice(0, limit);
}

export interface TeamPointsEntry {
  team: string;
  games: number;
  value: number;
}

// Most points scored.
export function pointsLeaders(
  results: CapitalFixture[],
  limit = 5
): TeamPointsEntry[] {
  const totals = new Map<string, { games: number; value: number }>();
  for (const fixture of results) {
    for (const side of [fixture.homeTeam, fixture.awayTeam] as const) {
      const entry = totals.get(side.name) ?? { games: 0, value: 0 };
      entry.games += 1;
      entry.value += parseScore(side.score);
      totals.set(side.name, entry);
    }
  }
  return [...totals.entries()]
    .map(([team, entry]) => ({ team, ...entry }))
    .sort((a, b) => b.value - a.value || a.team.localeCompare(b.team))
    .slice(0, limit);
}

// Fewest points conceded.
export function defenseLeaders(
  results: CapitalFixture[],
  limit = 5
): TeamPointsEntry[] {
  const totals = new Map<string, { games: number; value: number }>();
  for (const fixture of results) {
    const home = fixture.homeTeam;
    const away = fixture.awayTeam;
    const homeEntry = totals.get(home.name) ?? { games: 0, value: 0 };
    homeEntry.games += 1;
    homeEntry.value += parseScore(away.score);
    totals.set(home.name, homeEntry);
    const awayEntry = totals.get(away.name) ?? { games: 0, value: 0 };
    awayEntry.games += 1;
    awayEntry.value += parseScore(home.score);
    totals.set(away.name, awayEntry);
  }
  return [...totals.entries()]
    .map(([team, entry]) => ({ team, ...entry }))
    .sort((a, b) => a.value - b.value || a.team.localeCompare(b.team))
    .slice(0, limit);
}
