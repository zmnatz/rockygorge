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
  group: string;
  isLive: boolean;
  isBye: boolean;
  round: string;
  roundType: string;
  roundLabel: string;
  season: string;
  status: string;
  venue: string;
  sourceType: string;
  matchLabel: string;
  homeTeam: Team;
  awayTeam: Team;
  fixtureMeta: any;
}

export interface MatchCommentary {
  id: string;
  minute: string;
  type: string;
  comment: string;
}

export interface MatchPlayer {
  id: string;
  name: string;
  position: string;
  shirtNumber: string;
  isHome: boolean;
  photo: {
    id: string;
    url: string;
    alt: string;
  };
  link: string | null;
  captainType: string;
  frontRow: boolean | null;
}

export interface MatchLineUp {
  id: string;
  players: MatchPlayer[];
  substitutes: MatchPlayer[];
  coaches: MatchPlayer[];
}

export interface MatchStatsSummary {
  id: string;
  lineUp: MatchLineUp;
  substitutes: MatchPlayer[];
  coaches: MatchPlayer[];
  referees: any[];
  pointsSummary: any;
  playSummary: any;
}

export interface MatchData {
  getFixtureItem: FixtureItem;
  allMatchCommentary: MatchCommentary[];
  allMatchStatsSummary: MatchStatsSummary;
}
