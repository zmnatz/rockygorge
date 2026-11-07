import { sleep } from '@/utils/api';
import { type CapitalFixture, compareCompNames, isLeagueComp, isResult } from '@/api/capital';
import { fetchMatchCentre, isNameWithheld, playerKey } from '@/utils/playerHistory';
import { type ScoringKind, scoringKind } from '@/utils/scoring';

// Player scoring leaderboards per season and division, built from match
// centre data. The CMS commentary names the scorer ("Try - Riley Lopez") but
// carries no player id, so players are identified by team + name, with the
// team taken from that match's lineup.

export interface LeaderFixture {
  id: string;
  compId: string;
  compName: string;
  season: string;
  dateTime: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
}

export interface LineupEntry {
  // CMS player id, with the shirt number appended per match (see playerKey).
  id: string;
  name: string;
  isHome: boolean;
}

export interface LeaderMatch {
  fixture: LeaderFixture;
  commentary: { type: string; comment: string }[];
  players: LineupEntry[];
  substitutes: LineupEntry[];
}

export interface PlayerLine {
  // Stable CMS player id, for linking to the player page.
  playerId: string;
  name: string;
  team: string;
  tries: number;
  conversions: number;
  penaltyGoals: number;
  dropGoals: number;
  points: number;
  // Games the player was named in the match squad (starters and bench), in
  // games with a match centre. The CMS doesn't say who actually took the field.
  games: number;
}

// Which tally each kind of score feeds, and what it is worth.
const SCORING: Record<
  ScoringKind,
  { field: 'tries' | 'conversions' | 'penaltyGoals' | 'dropGoals'; points: number }
> = {
  try: { field: 'tries', points: 5 },
  conversion: { field: 'conversions', points: 2 },
  penaltyGoal: { field: 'penaltyGoals', points: 3 },
  dropGoal: { field: 'dropGoals', points: 3 },
};

function record(line: PlayerLine, kind: ScoringKind): void {
  line[SCORING[kind].field] += 1;
  line.points += SCORING[kind].points;
}

export interface LeadersDivision {
  compId: string;
  compName: string;
  // Played games counted, and how many had any scoring logged: referees
  // don't always record scorers, so totals cover gamesWithScoring only.
  games: number;
  gamesWithScoring: number;
  // Scoring events whose scorer couldn't be placed in the match lineup
  // (not listed, or the same name on both sides).
  unattributed: number;
  players: PlayerLine[];
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

// "Try - Riley Lopez" -> "Riley Lopez"
function scorerName(comment: string): string {
  const dash = comment.indexOf(' - ');
  return dash === -1 ? '' : comment.slice(dash + 3).trim();
}

export interface LeadersSeason {
  season: string;
  divisions: LeadersDivision[];
}

// Tallies scoring per season and division. `played` is every played game,
// so coverage counts games whose match centre never loaded too; it defaults
// to the games in `matches`.
export function tallyLeaders(
  matches: LeaderMatch[],
  played: LeaderFixture[] = matches.map((match) => match.fixture)
): LeadersSeason[] {
  const seasons = new Map<string, Map<string, LeadersDivision>>();
  const divisionFor = (fixture: LeaderFixture): LeadersDivision => {
    const divisions = seasons.get(fixture.season) ?? new Map<string, LeadersDivision>();
    seasons.set(fixture.season, divisions);
    const division = divisions.get(fixture.compId) ?? {
      compId: fixture.compId,
      compName: fixture.compName,
      games: 0,
      gamesWithScoring: 0,
      unattributed: 0,
      players: [],
    };
    divisions.set(fixture.compId, division);
    return division;
  };
  for (const fixture of played) {
    divisionFor(fixture).games += 1;
  }
  // Squad appearances per division, keyed by team + normalised name.
  const appearances = new Map<LeadersDivision, Map<string, number>>();
  for (const { fixture, commentary, players, substitutes } of matches) {
    const division = divisionFor(fixture);
    const roster = [...players, ...substitutes];
    const counts = appearances.get(division) ?? new Map<string, number>();
    appearances.set(division, counts);
    const named = new Set(
      roster.map(
        (entry) =>
          `${entry.isHome ? fixture.homeTeam.name : fixture.awayTeam.name}|${normalizeName(entry.name)}`
      )
    );
    for (const key of named) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    if (commentary.some((event) => scoringKind(event.type))) {
      division.gamesWithScoring += 1;
    }
    for (const event of commentary) {
      const scoring = scoringKind(event.type);
      if (!scoring) continue;
      const wanted = normalizeName(scorerName(event.comment));
      const named = roster.filter((entry) => normalizeName(entry.name) === wanted);
      const sides = new Set(named.map((entry) => entry.isHome));
      const player = named[0];
      if (!wanted || isNameWithheld(wanted) || !player || sides.size !== 1) {
        division.unattributed += 1;
        continue;
      }
      // The lineup spelling is the display name; the comment's casing varies.
      const name = player.name.trim();
      const team = player.isHome ? fixture.homeTeam.name : fixture.awayTeam.name;
      let line = division.players.find(
        (entry) => normalizeName(entry.name) === wanted && entry.team === team
      );
      if (!line) {
        line = {
          // Entries cached before lineups carried ids have none.
          playerId: player.id ? playerKey(player.id) : '',
          name,
          team,
          tries: 0,
          conversions: 0,
          penaltyGoals: 0,
          dropGoals: 0,
          points: 0,
          games: 0,
        };
        division.players.push(line);
      }
      record(line, scoring);
    }
  }
  for (const [division, counts] of appearances) {
    for (const line of division.players) {
      line.games = counts.get(`${line.team}|${normalizeName(line.name)}`) ?? 0;
    }
  }
  return [...seasons.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([season, divisions]) => ({
      season,
      divisions: [...divisions.values()]
        .sort((a, b) => compareCompNames(a.compName, b.compName))
        .map((division) => ({ ...division, players: division.players.sort(byRank) })),
    }));
}

function byRank(a: PlayerLine, b: PlayerLine): number {
  return b.points - a.points || b.tries - a.tries || a.name.localeCompare(b.name);
}

export interface LeadersSnapshot {
  generatedAt: string;
  seasons: LeadersSeason[];
}

// Scorers are sometimes logged days after a game, so only games older than
// this are trusted from the cache; newer ones are refetched every build.
const SETTLED_MS = 7 * 24 * 60 * 60 * 1000;

// Match centres fetched on an earlier build, keyed by fixture id. null
// records a game the CMS has no match centre for, so it isn't asked again;
// undefined means not fetched yet.
export interface MatchCache {
  get(fixtureId: string): LeaderMatch | null | undefined;
  set(fixtureId: string, match: LeaderMatch | null): void;
}

export interface LeadersBuildResult extends LeadersSnapshot {
  // Played games the build tried to load, and how many fetches threw
  // (throttling, network) -- the script rejects the build above a threshold.
  attempted: number;
  failed: number;
}

export async function buildLeadersSnapshot({
  fetchFixtures,
  fetchMatch,
  cache,
  now = () => new Date(),
  concurrency = 1,
  gapMs = 0,
}: {
  fetchFixtures: () => Promise<CapitalFixture[]>;
  fetchMatch: (fixture: CapitalFixture) => Promise<LeaderMatch | null>;
  cache: MatchCache;
  now?: () => Date;
  concurrency?: number;
  gapMs?: number;
}): Promise<LeadersBuildResult> {
  const at = now();
  const played = (await fetchFixtures()).filter(
    (fixture) => isLeagueComp(fixture.compName) && isResult(fixture, at.getTime())
  );
  const queue = [...played];
  const matches: LeaderMatch[] = [];
  const attempted = played.length;
  // Thrown fetches (throttling, network) count as failures; a game with no
  // match centre published is simply absent data.
  let failed = 0;
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    for (let fixture = queue.shift(); fixture; fixture = queue.shift()) {
      const settled = at.getTime() - new Date(fixture.dateTime).getTime() > SETTLED_MS;
      const cached = settled ? cache.get(fixture.id) : undefined;
      if (cached !== undefined) {
        if (cached) matches.push(cached);
        continue;
      }
      try {
        const match = await fetchMatch(fixture);
        cache.set(fixture.id, match);
        if (match) matches.push(match);
      } catch {
        // Not cached: a failed fetch is retried on the next build.
        failed += 1;
      }
      if (gapMs > 0) {
        await sleep(gapMs);
      }
    }
  });
  await Promise.all(workers);
  return { generatedAt: at.toISOString(), seasons: tallyLeaders(matches, played), attempted, failed };
}

// CMS adapter: the match centre for one fixture, trimmed to what the
// leaderboard needs (scoring commentary and lineup names) so cached games
// stay small. Division and season come from the fixture list, which is
// authoritative for both.
export async function fetchLeaderMatch(fixture: CapitalFixture): Promise<LeaderMatch | null> {
  const data = await fetchMatchCentre(fixture);
  if (!data) {
    return null;
  }
  const lineup = (players: LineupEntry[]) =>
    players.map(({ id, name, isHome }) => ({ id, name, isHome }));
  return {
    fixture: {
      id: fixture.id,
      compId: fixture.compId,
      compName: fixture.compName,
      season: fixture.season,
      dateTime: fixture.dateTime,
      homeTeam: { name: fixture.homeTeam.name },
      awayTeam: { name: fixture.awayTeam.name },
    },
    commentary: data.commentary
      .filter((event) => scoringKind(event.type))
      .map(({ type, comment }) => ({ type, comment })),
    players: lineup(data.players),
    substitutes: lineup(data.substitutes),
  };
}
