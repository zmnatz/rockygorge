import { postWithRetry } from '@/utils/api';
import type { FixtureItem, MatchPlayer } from '@/types/match';

const SCORES_URL = 'https://rugby-au-cms.graphcdn.app';

const CLUB_ENTITY_ID = 91273;
const CLUB_NAME = 'Rocky Gorge';

// Gap between sequential fetches so build-time aggregation stays polite
// to the CMS endpoint.
const FETCH_GAP_MS = 500;

// Upper bound on fixtures scanned so build-time aggregation stays finite.
const MAX_FIXTURES = 500;
const PAGE_SIZE = 100;

export interface PlayerGameLog {
  fixtureId: string;
  season: string;
  dateTime: string;
  compName: string;
  opponent: string;
  scoreFor: string;
  scoreAgainst: string;
  result: 'W' | 'L' | 'D';
  starter: boolean;
  played: boolean;
}

export interface PlayerScoringEvent {
  id: string;
  fixtureId: string;
  season: string;
  dateTime: string;
  compName: string;
  opponent: string;
  minute: string;
  type: string;
  comment: string;
}

export interface PlayerHistory {
  id: string;
  name: string;
  teamName: string;
  games: PlayerGameLog[];
  scoringEvents: PlayerScoringEvent[];
}

interface FixtureLookupItem {
  id: string;
  compId: string;
  compName: string;
  dateTime: string;
  season: string;
  sourceType: string;
  homeTeam: { name: string; score: string };
  awayTeam: { name: string; score: string };
}

interface MatchCentreData {
  fixture: FixtureItem & { season: string };
  commentary: { id: string; minute: string; type: string; comment: string }[];
  players: MatchPlayer[];
  substitutes: MatchPlayer[];
  coaches: MatchPlayer[];
}

// CMS player ids are stable across fixtures with the shirt number appended
// (e.g. "yJrSfLH8RmeSLDTu5__9"). The base identifies the player over time.
export function playerKey(id: string): string {
  return id.split('__')[0];
}

export function isScoreEventType(type: string): boolean {
  const normalized = type.toLowerCase();
  return (
    normalized.includes('try') ||
    normalized.includes('conversion') ||
    normalized.includes('goal')
  );
}

export function aggregatePlayerHistory(
  matches: MatchCentreData[]
): Map<string, PlayerHistory> {
  const histories = new Map<string, PlayerHistory>();

  for (const match of matches) {
    const { fixture, commentary, players, substitutes, coaches } = match;
    const roster = [...players, ...substitutes, ...coaches];
    const starterIds = new Set(players.map((player) => playerKey(player.id)));
    const cameOnNames = new Set(
      commentary.flatMap((event) => {
        if (!event.type.toLowerCase().includes('substitut')) {
          return [];
        }
        const onMatch = event.comment.match(/on:\s*(.+?)\s*$/i);
        return onMatch ? [onMatch[1].trim().toLowerCase()] : [];
      })
    );

    for (const player of roster) {
      const key = playerKey(player.id);
      let history = histories.get(key);
      if (!history) {
        history = {
          id: key,
          name: player.name,
          teamName: player.isHome ? fixture.homeTeam.name : fixture.awayTeam.name,
          games: [],
          scoringEvents: [],
        };
        histories.set(key, history);
      }

      const isHome = player.isHome;
      const ownScore = isHome ? fixture.homeTeam.score : fixture.awayTeam.score;
      const otherScore = isHome ? fixture.awayTeam.score : fixture.homeTeam.score;
      const isStarter = starterIds.has(key);
      const isSub = substitutes.some(
        (sub) => playerKey(sub.id) === key || sub.name.toLowerCase() === player.name.toLowerCase()
      );
      const subName = player.name.toLowerCase();
      const cameOn =
        isStarter ||
        !isSub ||
        cameOnNames.has(subName) ||
        [...cameOnNames].some(
          (name) => name.split(/\s+/).pop() === subName.split(/\s+/).pop()
        );

      history.games.push({
        fixtureId: fixture.id,
        season: fixture.season,
        dateTime: fixture.dateTime,
        compName: fixture.compName,
        opponent: isHome ? fixture.awayTeam.name : fixture.homeTeam.name,
        scoreFor: ownScore,
        scoreAgainst: otherScore,
        result: matchResult(ownScore, otherScore),
        starter: isStarter,
        played: cameOn,
      });

      const name = player.name.toLowerCase();
      for (const event of commentary) {
        if (
          isScoreEventType(event.type) &&
          name &&
          event.comment.toLowerCase().includes(name)
        ) {
          history.scoringEvents.push({
            id: event.id,
            fixtureId: fixture.id,
            season: fixture.season,
            dateTime: fixture.dateTime,
            compName: fixture.compName,
            opponent: isHome ? fixture.awayTeam.name : fixture.homeTeam.name,
            minute: event.minute,
            type: event.type,
            comment: event.comment,
          });
        }
      }
    }
  }

  for (const history of histories.values()) {
    history.games.sort(
      (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
    );
    history.scoringEvents.sort(
      (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
    );
  }

  return histories;
}

function matchResult(
  ownScore: string,
  otherScore: string
): 'W' | 'L' | 'D' {
  const own = parseInt(ownScore || '0', 10);
  const other = parseInt(otherScore || '0', 10);
  if (own > other) return 'W';
  if (own < other) return 'L';
  return 'D';
}

const FIXTURE_LOOKUP_QUERY = `query PlayerHistoryFixtureLookupQuery($entityId: Int, $entityType: String, $type: String, $skip: Int, $limit: Int) {
  getEntityFixturesAndResults(
    type: $type
    entityId: $entityId
    entityType: $entityType
    limit: $limit
    skip: $skip
  ) {
    id
    compId
    compName
    dateTime
    season
    sourceType
    homeTeam { name score __typename }
    awayTeam { name score __typename }
    __typename
  }
}`;

const MATCH_CENTRE_QUERY = `query PlayerHistoryMatchCentreQuery($comp: CompInput) {
  getFixtureItem(comp: $comp) {
    id
    compId
    compName
    dateTime
    season
    venue
    homeTeam { id name teamId score crest __typename }
    awayTeam { id name teamId score crest __typename }
    __typename
  }
  allMatchCommentary(comp: $comp) {
    id
    minute
    type
    comment
    __typename
  }
  allMatchStatsSummary(comp: $comp) {
    id
    lineUp {
      players { id name position shirtNumber isHome __typename }
      substitutes { id name position shirtNumber isHome __typename }
      coaches { id name position shirtNumber isHome __typename }
      __typename
    }
    __typename
  }
}`;

interface MatchCentreResponse {
  getFixtureItem: FixtureItem | null;
  allMatchCommentary:
    | { id: string; minute: string; type: string; comment: string }[]
    | null;
  allMatchStatsSummary: {
    lineUp: {
      players: MatchPlayer[];
      substitutes: MatchPlayer[];
      coaches: MatchPlayer[];
    };
  } | null;
}

export interface BuildProgress {
  done: number;
  total: number;
}

interface BuildOptions {
  concurrency?: number;
  onProgress?: (progress: BuildProgress) => void;
}

export async function buildPlayerHistories(
  options?: BuildOptions
): Promise<Map<string, PlayerHistory>> {
  const fixtures = (await fetchAllFixtures()).filter(
    (fixture) =>
      fixture.homeTeam.score.length > 0 &&
      fixture.awayTeam.score.length > 0
  );

  const onProgress = options?.onProgress;
  const matches: MatchCentreData[] = [];
  let done = 0;
  const workers = new Array(Math.max(1, options?.concurrency ?? 1))
    .fill(null)
    .map(async () => {
      while (fixtures.length > 0) {
        const fixture = fixtures.shift();
        if (!fixture) {
          return;
        }
        const data = await fetchMatchCentre(fixture).catch(() => null);
        if (data) {
          matches.push(data);
        }
        done += 1;
        onProgress?.({ done, total: done + fixtures.length });
      }
    });
  await Promise.all(workers);

  return aggregatePlayerHistory(matches);
}

async function fetchFixturePage(skip: number): Promise<FixtureLookupItem[]> {
  const response = await postWithRetry<{
    data: { getEntityFixturesAndResults: FixtureLookupItem[] };
  }>(SCORES_URL, {
    operationName: 'PlayerHistoryFixtureLookupQuery',
    variables: {
      entityId: CLUB_ENTITY_ID,
      entityType: 'club',
      type: 'all',
      skip,
      limit: PAGE_SIZE,
    },
    query: FIXTURE_LOOKUP_QUERY,
  });
  return response.data.getEntityFixturesAndResults;
}

// Finds a single fixture by id, paging through the feed and stopping as
// soon as it is found. Used by the game page so older games resolve too.
export async function findFixtureById(
  matchId: string
): Promise<FixtureLookupItem | undefined> {
  for (let skip = 0; skip < MAX_FIXTURES; skip += PAGE_SIZE) {
    const page = await fetchFixturePage(skip);
    const found = page.find((fixture) => fixture.id === matchId);
    if (found) {
      return found;
    }
    if (page.length < PAGE_SIZE) {
      return undefined;
    }
  }
  return undefined;
}

async function fetchAllFixtures(): Promise<FixtureLookupItem[]> {
  const all: FixtureLookupItem[] = [];
  for (let skip = 0; skip < MAX_FIXTURES; skip += PAGE_SIZE) {
    const page = await fetchFixturePage(skip);
    all.push(...page);
    if (page.length < PAGE_SIZE) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, FETCH_GAP_MS));
  }
  return all;
}

async function fetchMatchCentre(
  fixture: FixtureLookupItem
): Promise<MatchCentreData | null> {
  const response = await postWithRetry<{ data: MatchCentreResponse }>(SCORES_URL, {
    operationName: 'PlayerHistoryMatchCentreQuery',
    variables: {
      comp: {
        id: fixture.compId,
        season: fixture.season,
        fixture: fixture.id,
        sourceType: fixture.sourceType ?? '2',
      },
    },
    query: MATCH_CENTRE_QUERY,
  });

  const { getFixtureItem, allMatchCommentary, allMatchStatsSummary } =
    response.data;
  if (!getFixtureItem || !allMatchStatsSummary) {
    return null;
  }

  return {
    fixture: { ...getFixtureItem, season: fixture.season },
    commentary: allMatchCommentary ?? [],
    players: allMatchStatsSummary.lineUp.players,
    substitutes: allMatchStatsSummary.lineUp.substitutes,
    coaches: allMatchStatsSummary.lineUp.coaches,
  };
}
