import { mapConcurrent, postWithRetry, sleep } from '@/utils/api';
import { scoringKind } from '@/utils/scoring';
import type { FixtureItem, MatchPlayer } from '@/types/match';

const SCORES_URL = 'https://rugby-au-cms.graphcdn.app';

const CLUB_ENTITY_ID = 91273;

const MAX_FIXTURES = 500;
const PAGE_SIZE = 100;
// Breathing room between match-centre requests so snapshot builds don't trip
// the CMS rate limit (HTTP 429).
const MATCH_CENTRE_GAP_MS = 300;
const RETRY_PASS_DELAY_MS = 15_000;

// Under public/; the script writes it, the page fetches it from the site root.
export const PLAYERS_SNAPSHOT_DIR = 'data/players';

// Per-player snapshot path, shared by the build script and the player page.
export function playerSnapshotFile(id: string): string {
  return `${encodeURIComponent(id)}.json`;
}

// Loads one player's history from the per-player snapshot (written by
// scripts/generate-players.ts). Player links only come from results, so
// a missing file just means null; any other failure throws. The host's
// catch-all rewrite answers a missing file with index.html and a 200, so a
// non-JSON response counts as missing too.
export async function loadPlayerHistory(
  id: string
): Promise<PlayerHistory | null> {
  const res = await fetch(`/${PLAYERS_SNAPSHOT_DIR}/${playerSnapshotFile(id)}`);
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`Player history request failed: ${res.status}`);
  }
  if (!res.headers.get('content-type')?.includes('json')) {
    return null;
  }
  return (await res.json()) as PlayerHistory;
}

export interface PlayerGameLog {
  fixtureId: string;
  season: string;
  dateTime: string;
  compName: string;
  // The side the player was listed for in this game. A player can appear for
  // more than one side of a club, so PlayerHistory.teamName can't answer this.
  teamName: string;
  opponent: string;
  scoreFor: string;
  scoreAgainst: string;
  result: 'W' | 'L' | 'D';
  starter: boolean;
  played: boolean;
  // Listed only as a coach for this game, so not a playing appearance.
  coach: boolean;
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
  /** Whether the eligibility site has a page for this player, which the player page then
   *  links to. Set by the snapshot generator, not by `aggregatePlayerHistory`. */
  eligibility?: boolean;
}

interface FixtureLookupItem {
  id: string;
  compId: string;
  compName: string;
  dateTime: string;
  season: string;
  round?: string;
  status?: string;
  sourceType: string;
  homeTeam: { name: string; score: string };
  awayTeam: { name: string; score: string };
}

export interface MatchCentreData {
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

// The CMS shows a player whose profile isn't public as "Name Withheld". It isn't
// a person: each record is a hidden profile, so it never becomes a player record.
export function isNameWithheld(name: string): boolean {
  return name.trim().replace(/\s+/g, ' ').toLowerCase() === 'name withheld';
}

export function isScoreEventType(type: string): boolean {
  return scoringKind(type) !== null;
}

const surname = (name: string) => name.split(/\s+/).pop();

// Which listed substitutes the commentary shows coming on. Events don't name a
// side, so the player coming off supplies it when that name is in the lineup.
// Each event accounts for one substitute. A name with no exact match falls back
// to its surname only when one listed substitute has that surname, since a
// surname can be shared within a side or with the opposition.
function substitutesWhoCameOn(
  players: MatchPlayer[],
  substitutes: MatchPlayer[],
  commentary: MatchCentreData['commentary']
): Set<string> {
  const lineup = [...players, ...substitutes];
  const events = commentary.flatMap((event) => {
    if (!event.type.toLowerCase().includes('substitut')) {
      return [];
    }
    const match = event.comment.match(/(?:off:\s*(.+?),\s*)?on:\s*(.+?)\s*$/i);
    if (!match) {
      return [];
    }
    const off = match[1]?.trim().toLowerCase();
    const sides = new Set(
      lineup.filter((player) => player.name.toLowerCase() === off).map((player) => player.isHome)
    );
    return [{ name: match[2].trim().toLowerCase(), isHome: sides.size === 1 ? [...sides][0] : null }];
  });

  const onSide = (sub: MatchPlayer, isHome: boolean | null) =>
    isHome === null || sub.isHome === isHome;
  const cameOn = new Set<string>();

  const unmatched = events.filter(({ name, isHome }) => {
    const exact = substitutes.find(
      (sub) =>
        !cameOn.has(playerKey(sub.id)) &&
        sub.name.toLowerCase() === name &&
        onSide(sub, isHome)
    );
    if (exact) {
      cameOn.add(playerKey(exact.id));
    }
    return !exact;
  });
  for (const { name, isHome } of unmatched) {
    const sameSurname = substitutes.filter(
      (sub) => surname(sub.name.toLowerCase()) === surname(name) && onSide(sub, isHome)
    );
    if (sameSurname.length === 1) {
      cameOn.add(playerKey(sameSurname[0].id));
    }
  }
  return cameOn;
}

export function aggregatePlayerHistory(
  matches: MatchCentreData[]
): Map<string, PlayerHistory> {
  const histories = new Map<string, PlayerHistory>();
  // Newest first, because matches arrive in whichever order they finished
  // downloading and a player's name and team come from the first one seen.
  const ordered = [...matches].sort(
    (a, b) =>
      new Date(b.fixture.dateTime).getTime() - new Date(a.fixture.dateTime).getTime() ||
      a.fixture.id.localeCompare(b.fixture.id)
  );

  for (const match of ordered) {
    const { fixture, commentary, players, substitutes, coaches } = match;
    const roster = [...players, ...substitutes, ...coaches];
    const starterIds = new Set(players.map((player) => playerKey(player.id)));
    const cameOnIds = substitutesWhoCameOn(players, substitutes, commentary);

    // Roster order puts playing roles first, so a player-coach listed twice
    // gets one game, recorded as the player.
    const seenInFixture = new Set<string>();

    for (const player of roster) {
      const key = playerKey(player.id);
      if (seenInFixture.has(key) || isNameWithheld(player.name)) {
        continue;
      }
      seenInFixture.add(key);

      let history = histories.get(key);
      if (!history) {
        history = {
          id: key,
          name: player.name.trim().replace(/\s+/g, ' '),
          teamName: player.isHome ? fixture.homeTeam.name : fixture.awayTeam.name,
          games: [],
          scoringEvents: [],
        };
        histories.set(key, history);
      }

      const isHome = player.isHome;
      const ownTeam = isHome ? fixture.homeTeam.name : fixture.awayTeam.name;
      const ownScore = isHome ? fixture.homeTeam.score : fixture.awayTeam.score;
      const otherScore = isHome ? fixture.awayTeam.score : fixture.homeTeam.score;
      const isStarter = starterIds.has(key);
      const isSub = substitutes.some((sub) => playerKey(sub.id) === key);
      const isCoach = !isStarter && !isSub;
      const cameOn = isStarter || cameOnIds.has(key);

      history.games.push({
        fixtureId: fixture.id,
        season: fixture.season,
        dateTime: fixture.dateTime,
        compName: fixture.compName,
        teamName: ownTeam,
        opponent: isHome ? fixture.awayTeam.name : fixture.homeTeam.name,
        scoreFor: ownScore,
        scoreAgainst: otherScore,
        result: matchResult(ownScore, otherScore),
        starter: isStarter,
        played: cameOn,
        coach: isCoach,
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
    history.games.sort(newestFirst);
    history.scoringEvents.sort(newestFirst);
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
    round
    status
    sourceType
    homeTeam { name score __typename }
    awayTeam { name score __typename }
    __typename
  }
}`;

// The fields read for each match, shared by the single and batched queries.
const MATCH_FIXTURE_FIELDS = `{
    id
    compId
    compName
    dateTime
    season
    venue
    homeTeam { id name teamId score crest __typename }
    awayTeam { id name teamId score crest __typename }
    __typename
  }`;
const MATCH_COMMENTARY_FIELDS = `{ id minute type comment __typename }`;
const MATCH_STATS_FIELDS = `{
    id
    lineUp {
      players { id name position shirtNumber isHome __typename }
      substitutes { id name position shirtNumber isHome __typename }
      coaches { id name position shirtNumber isHome __typename }
      __typename
    }
    __typename
  }`;

const MATCH_CENTRE_QUERY = `query PlayerHistoryMatchCentreQuery($comp: CompInput) {
  getFixtureItem(comp: $comp) ${MATCH_FIXTURE_FIELDS}
  allMatchCommentary(comp: $comp) ${MATCH_COMMENTARY_FIELDS}
  allMatchStatsSummary(comp: $comp) ${MATCH_STATS_FIELDS}
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

// Newest first; same-time entries order by fixture id so the snapshot output
// is identical between runs (fetch order is not).
function newestFirst(
  a: { dateTime: string; fixtureId: string },
  b: { dateTime: string; fixtureId: string }
): number {
  return (
    new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime() ||
    a.fixtureId.localeCompare(b.fixtureId)
  );
}

export interface FetchMatchesOptions {
  concurrency?: number;
  gapMs?: number;
  retryPasses?: number;
  retryDelayMs?: number;
  // Give up at the first failure, with no retry passes, for callers with
  // someone waiting and a fallback to use.
  stopOnFailure?: boolean;
}

// Fetches each fixture's match, then retries failures one at a time after a
// pause, which gives a rate limit time to clear. A fixture that answers with
// null has no data, which is different from one that failed and ends up in
// `failed`.
export async function fetchMatches<Fixture, Match>(
  fixtures: Fixture[],
  fetchOne: (fixture: Fixture) => Promise<Match | null>,
  {
    concurrency = 1,
    gapMs = MATCH_CENTRE_GAP_MS,
    retryPasses = 2,
    retryDelayMs = RETRY_PASS_DELAY_MS,
    stopOnFailure = false,
  }: FetchMatchesOptions = {}
): Promise<{ matches: Match[]; failed: Fixture[] }> {
  const matches: Match[] = [];
  const runPass = async (pending: Fixture[], workers: number) => {
    const queue = [...pending];
    const failed: Fixture[] = [];
    await Promise.all(
      new Array(Math.max(1, workers)).fill(null).map(async () => {
        for (let fixture = queue.shift(); fixture !== undefined; fixture = queue.shift()) {
          try {
            const match = await fetchOne(fixture);
            if (match !== null) {
              matches.push(match);
            }
          } catch {
            failed.push(fixture);
            if (stopOnFailure) {
              queue.length = 0;
            }
          }
          await sleep(gapMs);
        }
      })
    );
    return failed;
  };

  let failed = await runPass(fixtures, concurrency);
  for (let pass = 0; !stopOnFailure && pass < retryPasses && failed.length > 0; pass++) {
    await sleep(retryDelayMs);
    failed = await runPass(failed, 1);
  }
  return { matches, failed };
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

type MatchCentreFixture = Pick<FixtureLookupItem, 'id' | 'compId' | 'season' | 'sourceType'>;

const compInput = (fixture: MatchCentreFixture) => ({
  id: fixture.compId,
  season: fixture.season,
  fixture: fixture.id,
  sourceType: fixture.sourceType ?? '2',
});

function toMatchCentreData(
  fixture: MatchCentreFixture,
  { getFixtureItem, allMatchCommentary, allMatchStatsSummary }: MatchCentreResponse
): MatchCentreData | null {
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

/** Matches per request. The CMS answers several in one request, which counts
 *  once against its rate limit; batches of 25 to 150 all worked, taking 2 to 31
 *  seconds. See docs/snapshots.md. */
export const MATCH_BATCH_SIZE = 100;

/** Several matches in one request, each under its own alias. A match the CMS has
 *  no details for is null. Throws if the CMS reports any error, so a caller can
 *  fall back to asking one at a time. */
export async function fetchMatchCentres(
  fixtures: MatchCentreFixture[]
): Promise<Map<string, MatchCentreData | null>> {
  const declarations = fixtures.map((_, index) => `$c${index}: CompInput`).join(', ');
  const selections = fixtures
    .map(
      (_, index) =>
        `m${index}: getFixtureItem(comp: $c${index}) ${MATCH_FIXTURE_FIELDS}
  e${index}: allMatchCommentary(comp: $c${index}) ${MATCH_COMMENTARY_FIELDS}
  s${index}: allMatchStatsSummary(comp: $c${index}) ${MATCH_STATS_FIELDS}`
    )
    .join('\n  ');
  const response = await postWithRetry<{
    data: Record<string, unknown> | null;
    errors?: { message: string }[];
  }>(SCORES_URL, {
    query: `query MatchCentreBatch(${declarations}) {\n  ${selections}\n}`,
    variables: Object.fromEntries(fixtures.map((fixture, index) => [`c${index}`, compInput(fixture)])),
  });
  if (response.errors?.length || !response.data) {
    throw new Error(`Match centre batch failed: ${response.errors?.[0]?.message ?? 'no data'}`);
  }
  const data = response.data;
  return new Map(
    fixtures.map((fixture, index) => [
      fixture.id,
      toMatchCentreData(fixture, {
        getFixtureItem: data[`m${index}`] as MatchCentreResponse['getFixtureItem'],
        allMatchCommentary: data[`e${index}`] as MatchCentreResponse['allMatchCommentary'],
        allMatchStatsSummary: data[`s${index}`] as MatchCentreResponse['allMatchStatsSummary'],
      }),
    ])
  );
}

/** fetchMatches in batches: each batch is one request, and a batch the CMS
 *  rejects is asked again one match at a time, so only a bad match fails. */
export async function fetchMatchesInBatches<Fixture extends MatchCentreFixture>(
  fixtures: Fixture[],
  { batchSize = MATCH_BATCH_SIZE, concurrency = 2, ...options }: FetchMatchesOptions & { batchSize?: number } = {}
): Promise<{ matches: MatchCentreData[]; failed: Fixture[] }> {
  const batches: Fixture[][] = [];
  for (let start = 0; start < fixtures.length; start += batchSize) {
    batches.push(fixtures.slice(start, start + batchSize));
  }
  const matches: MatchCentreData[] = [];
  const rejected: Fixture[] = [];
  await mapConcurrent(batches, concurrency, async (batch) => {
    try {
      for (const match of (await fetchMatchCentres(batch)).values()) {
        if (match) matches.push(match);
      }
    } catch {
      rejected.push(...batch);
    }
  });
  const retried = await fetchMatches<Fixture, MatchCentreData>(rejected, (fixture) => fetchMatchCentre(fixture), options);
  return { matches: [...matches, ...retried.matches], failed: retried.failed };
}

export async function fetchMatchCentre(
  fixture: MatchCentreFixture
): Promise<MatchCentreData | null> {
  const response = await postWithRetry<{
    data: MatchCentreResponse;
    errors?: { message: string }[];
  }>(SCORES_URL, {
    operationName: 'PlayerHistoryMatchCentreQuery',
    variables: { comp: compInput(fixture) },
    query: MATCH_CENTRE_QUERY,
  });

  // A throttled or failed query can still answer 200, so it mustn't read as a
  // fixture with no data.
  if (response.errors?.length) {
    throw new Error(`Match centre query failed: ${response.errors[0].message}`);
  }

  return toMatchCentreData(fixture, response.data);
}
