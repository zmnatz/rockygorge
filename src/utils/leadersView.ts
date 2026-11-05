import type { LeadersDivision, PlayerLine } from '@/utils/leaders';

export type LeaderSortKey = 'points' | 'tries' | 'conversions' | 'penaltyGoals';

// The chosen column ranks first; points then tries break ties, so the
// default view is the same order the build snapshot is written in.
export function sortPlayers(players: PlayerLine[], key: LeaderSortKey): PlayerLine[] {
  return [...players].sort(
    (a, b) =>
      b[key] - a[key] ||
      b.points - a.points ||
      b.tries - a.tries ||
      a.name.localeCompare(b.name)
  );
}

export function coverageNote(
  division: Pick<LeadersDivision, 'games' | 'gamesWithScoring' | 'unattributed'>
): string {
  const scores = division.unattributed === 1 ? 'score' : 'scores';
  return `Based on ${division.gamesWithScoring} of ${division.games} games with scoring logged; ${division.unattributed} ${scores} unattributed.`;
}
