import type { Team } from '@/types/match';

export interface Score {
    id: string;
    homeTeam: Team;
    awayTeam: Team;
    dateTime: string;
    compName: string;
    // Feed fields the snapshot carries for every club fixture, upcoming
    // included (the next-game card is seeded from them).
    compId?: string;
    season?: string;
    status?: string;
    venue?: string;
    sourceType?: string;
    isLive?: boolean;
}

// A fixture that has been played (or is being played): both sides have a
// score. Upcoming fixtures in the snapshot have empty scores.
export function hasScore(score: Score): boolean {
  return score.homeTeam.score.length > 0 && score.awayTeam.score.length > 0;
}
