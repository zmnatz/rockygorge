export interface GamedaySide {
  label: string;
  teamName: string;
  compName: string;
}

export interface MatchesConfig {
  sides: GamedaySide[];
}

// Minimal structural view of a CMS fixture: real feed items (Score,
// FixtureItem) satisfy this shape without importing feed types here.
export interface GamedayFixture {
  id: string;
  dateTime: string;
  status: string;
  isLive: boolean;
  homeTeam: { name: string };
  awayTeam: { name: string };
}

export interface SideMatch {
  side: GamedaySide;
  fixture: GamedayFixture;
  isGorgeHome: boolean;
  opponent: string;
}

export type GamedayKind = 'today' | 'recap' | 'next' | 'none';

export interface ResolvedGameday {
  kind: GamedayKind;
  // Local calendar day (yyyy-mm-dd) of the resolved Gameday; '' when none.
  date: string;
  matches: SideMatch[];
}
