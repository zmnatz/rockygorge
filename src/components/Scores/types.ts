export interface Team {
    crest: string;
    name: string;
    score: string;
    teamId: string;
}
  
export interface Score {
    homeTeam: Team;
    awayTeam: Team;
    dateTime: Date;
    compName: string;
}