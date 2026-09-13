import type { Team } from '@/types/match';

export interface Score {
    id: string;
    homeTeam: Team;
    awayTeam: Team;
    dateTime: Date;
    compName: string;
}
