export interface Team {
  id: string;
  name: string;
  teamId: string;
  score: string;
  crest: string;
}

export interface FixtureItem {
  id: string;
  compId: string;
  compName: string;
  dateTime: string;
  venue: string;
  homeTeam: Team;
  awayTeam: Team;
}

export interface MatchCommentary {
  id: string;
  minute: string;
  comment: string;
  isHome: boolean;
}

export interface MatchPlayer {
  id: string;
  name: string;
  position: string;
  shirtNumber: string;
  isHome: boolean;
}

export interface MatchLineUp {
  players: MatchPlayer[];
  substitutes: MatchPlayer[];
  coaches: MatchPlayer[];
}

export interface MatchStatsSummary {
  lineUp: MatchLineUp;
}

export interface MatchData {
  getFixtureItem: FixtureItem;
  allMatchCommentary: MatchCommentary[];
  allMatchStatsSummary: MatchStatsSummary;
}
