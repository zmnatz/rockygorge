import { useQuery } from '@tanstack/react-query';
import { postWithRetry } from '@/utils/api';
import { isPlaceholderCrest } from '@/utils/crest';

export const CAPITAL_UNION_ID = 90067;
export const CAPITAL_ENTITY_TYPE = 'geographical-union';

// Rocky Gorge's own club feed. Neither feed is complete on its own: the
// union feed is missing whole rounds (e.g. most of 2025/2026 Rounds 7-10)
// while the club feed only covers competitions Rocky Gorge plays in. Merging
// both, deduped by fixture id, gives the full league picture.
export const CLUB_ENTITY_ID = 91273;
export const CLUB_ENTITY_TYPE = 'club';

const SCORES_URL = 'https://rugby-au-cms.graphcdn.app';
const PAGE_SIZE = 100;
const MAX_FIXTURES = 1500;
const FETCH_GAP_MS = 300;

export interface CapitalTeam {
  name: string;
  score: string;
  crest: string;
}

export interface CapitalFixture {
  id: string;
  compId: string;
  compName: string;
  season: string;
  dateTime: string;
  round: string;
  roundLabel: string;
  status: string;
  sourceType: string;
  homeTeam: CapitalTeam;
  awayTeam: CapitalTeam;
}

export interface LadderTeam {
  id: string;
  name: string;
  crest: string;
  position: number;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  matchesDrawn: number;
  pointsFor: number;
  pointsAgainst: number;
  pointsDifference: number;
  pointsRatio: number;
  pointsADJ: number;
  pointsForADJ: number;
  bonusPoints3T: number;
  bonusPoints4T: number;
  bonusPoints7P: number;
  totalBonusPoints: number;
  totalMatchPoints: number;
  totalTries: number;
  byes: number;
}

export interface LadderPool {
  id: string;
  poolName: string;
  teams: LadderTeam[];
}

export interface CompLadder {
  id: string;
  hasPools: boolean;
  ladderPools: LadderPool[];
}

const CAPITAL_FIXTURES_QUERY = `query CapitalFixturesQuery($entityId: Int, $entityType: String, $type: String, $skip: Int, $limit: Int) {
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
    season
    dateTime
    round
    roundLabel
    status
    sourceType
    homeTeam { name score crest __typename }
    awayTeam { name score crest __typename }
    __typename
  }
}`;

const CAPITAL_LADDER_QUERY = `query CapitalLadderQuery($comp: CompInput) {
  compLadder(comp: $comp) {
    id
    hasPools
    ladderPools {
      id
      poolName
      teams {
        id
        name
        crest
        position
        matchesPlayed
        matchesWon
        matchesLost
        matchesDrawn
        pointsFor
        pointsAgainst
        pointsDifference
        pointsRatio
        pointsADJ
        pointsForADJ
        bonusPoints3T
        bonusPoints4T
        bonusPoints7P
        totalBonusPoints
        totalMatchPoints
        totalTries
        byes
        __typename
      }
      __typename
    }
    __typename
  }
}`;

async function fetchFixturesPage(
  entityId: number,
  entityType: string,
  skip: number
): Promise<CapitalFixture[]> {
  const response = await postWithRetry<{
    data: { getEntityFixturesAndResults: CapitalFixture[] };
  }>(SCORES_URL, {
    operationName: 'CapitalFixturesQuery',
    variables: {
      entityId,
      entityType,
      type: 'all',
      skip,
      limit: PAGE_SIZE,
    },
    query: CAPITAL_FIXTURES_QUERY,
  });
  return response.data.getEntityFixturesAndResults ?? [];
}

async function fetchFeed(
  entityId: number,
  entityType: string
): Promise<CapitalFixture[]> {
  const all: CapitalFixture[] = [];
  for (let skip = 0; skip < MAX_FIXTURES; skip += PAGE_SIZE) {
    const page = await fetchFixturesPage(entityId, entityType, skip);
    all.push(...page);
    if (page.length < PAGE_SIZE) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, FETCH_GAP_MS));
  }
  return all;
}

// Merges feeds deduped by fixture id. Primary order wins; secondary-only
// fixtures are appended.
export function mergeFixtures(
  primary: CapitalFixture[],
  secondary: CapitalFixture[]
): CapitalFixture[] {
  const seen = new Set(primary.map((fixture) => fixture.id));
  const merged = [...primary];
  for (const fixture of secondary) {
    if (!seen.has(fixture.id)) {
      seen.add(fixture.id);
      merged.push(fixture);
    }
  }
  return merged;
}

// Spreads known-good crests across fixtures: when one fixture carries a
// real logo for a team and another carries nothing (or the generic CMS
// placeholder), the real one wins everywhere so the same team never shows
// different badges in different spots.
export function backfillCrests(fixtures: CapitalFixture[]): CapitalFixture[] {
  const best = new Map<string, string>();
  for (const fixture of fixtures) {
    for (const side of [fixture.homeTeam, fixture.awayTeam]) {
      if (side?.crest && !isPlaceholderCrest(side.crest) && !best.has(side.name)) {
        best.set(side.name, side.crest);
      }
    }
  }
  if (best.size === 0) {
    return fixtures;
  }
  return fixtures.map((fixture) => ({
    ...fixture,
    homeTeam: withBestCrest(fixture.homeTeam, best),
    awayTeam: withBestCrest(fixture.awayTeam, best),
  }));
}

function withBestCrest(
  team: CapitalFixture['homeTeam'],
  best: Map<string, string>
): CapitalFixture['homeTeam'] {
  if (team?.crest && !isPlaceholderCrest(team.crest)) {
    return team;
  }
  const crest = best.get(team?.name);
  return crest ? { ...team, crest } : team;
}

export async function fetchAllCapitalFixtures(): Promise<CapitalFixture[]> {
  const union = await fetchFeed(CAPITAL_UNION_ID, CAPITAL_ENTITY_TYPE);
  const club = await fetchFeed(CLUB_ENTITY_ID, CLUB_ENTITY_TYPE);
  return backfillCrests(mergeFixtures(union, club));
}

// Finds a single fixture by id across both feeds, paging through and stopping
// as soon as it is found. Used by the game page so league games outside
// Rocky's own competitions resolve too.
export async function findCapitalFixtureById(
  matchId: string
): Promise<CapitalFixture | undefined> {
  for (const [entityId, entityType] of [
    [CAPITAL_UNION_ID, CAPITAL_ENTITY_TYPE],
    [CLUB_ENTITY_ID, CLUB_ENTITY_TYPE],
  ] as const) {
    for (let skip = 0; skip < MAX_FIXTURES; skip += PAGE_SIZE) {
      const page = await fetchFixturesPage(entityId, entityType, skip);
      const found = page.find((fixture) => fixture.id === matchId);
      if (found) {
        return found;
      }
      if (page.length < PAGE_SIZE) {
        break;
      }
    }
  }
  return undefined;
}

export interface LadderKey {
  compId: string;
  season: string;
  fixtureId: string;
  sourceType: string;
}

export async function fetchCompLadder(key: LadderKey): Promise<CompLadder | null> {
  const response = await postWithRetry<{
    data: { compLadder: CompLadder | null };
  }>(SCORES_URL, {
    operationName: 'CapitalLadderQuery',
    variables: {
      comp: {
        id: key.compId,
        season: key.season,
        fixture: key.fixtureId,
        sourceType: key.sourceType || '2',
      },
    },
    query: CAPITAL_LADDER_QUERY,
  });
  return response.data.compLadder;
}

export function useCapitalFixtures() {
  return useQuery({
    queryKey: ['capital-fixtures'],
    queryFn: fetchAllCapitalFixtures,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useCompLadder(key: LadderKey | null) {
  return useQuery({
    queryKey: ['capital-ladder', key?.compId, key?.season],
    queryFn: async () => {
      if (!key) {
        throw new Error('Missing ladder key');
      }
      return fetchCompLadder(key);
    },
    enabled: !!key,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export interface FixtureFilters {
  season: string;
  compId: string;
  team: string | string[];
}

// The CMS mints a new team id (and sometimes a new name: "D3" became "MD3")
// every season, so teams are grouped into stable cross-season identities by
// club, division number and side. Deliberately conservative: different base
// names ("Washington" vs "Washington Renegades") never merge.
export interface TeamIdentity {
  key: string;
  display: string;
  names: string[];
}

const DIV_TOKEN_PATTERN = /\s+(1st\s+XV|2nd\s+XV|U\d+|MD\d+|WD\d+|D\d+)$/i;
const GENDER_WORD_PATTERN = /\s+(men|women)$/i;

export function parseTeamIdentity(
  teamName: string,
  compName: string
): { key: string; display: string } {
  let rest = (teamName || '').trim();
  let div = '';
  let gender: 'M' | 'W' | null = null;

  const divMatch = rest.match(DIV_TOKEN_PATTERN);
  if (divMatch) {
    const token = divMatch[1].toUpperCase().replace(/\s+/g, ' ');
    if (token === '1ST XV') {
      div = 'D1';
    } else if (token === '2ND XV') {
      div = 'D2';
    } else {
      div = token;
    }
    if (token.startsWith('M')) {
      gender = 'M';
    } else if (token.startsWith('W')) {
      gender = 'W';
    }
    rest = rest.slice(0, divMatch.index).trim();
  }

  const genderMatch = rest.match(GENDER_WORD_PATTERN);
  if (genderMatch) {
    gender ??= genderMatch[1].toUpperCase().startsWith('W') ? 'W' : 'M';
    rest = rest.slice(0, genderMatch.index).trim();
  }

  if (!gender) {
    gender = /women/i.test(compName || '') ? 'W' : 'M';
  }

  const base = rest || teamName.trim();
  const divNumber = (div.match(/\d+/) || [])[0] ?? '';
  const canonicalDiv = div.startsWith('U') ? div : `D${divNumber}`;
  const display =
    canonicalDiv === 'D'
      ? base
      : `${base} ${div.startsWith('U') ? div : `${gender}D${divNumber}`}`;
  return { key: `${base.toLowerCase()}|${canonicalDiv}|${gender}`, display };
}

export function teamIdentities(
  fixtures: CapitalFixture[],
  season: string,
  compId: string
): TeamIdentity[] {
  const grouped = new Map<string, { display: string; names: Set<string> }>();
  for (const fixture of fixtures) {
    if (
      (season === ALL || fixture.season === season) &&
      (compId === ALL || fixture.compId === compId)
    ) {
      for (const side of [fixture.homeTeam, fixture.awayTeam]) {
        if (!side?.name) {
          continue;
        }
        const { key, display } = parseTeamIdentity(side.name, fixture.compName);
        let entry = grouped.get(key);
        if (!entry) {
          entry = { display, names: new Set() };
          grouped.set(key, entry);
        }
        entry.names.add(side.name);
      }
    }
  }
  return [...grouped.entries()]
    .map(([key, entry]) => ({ key, display: entry.display, names: [...entry.names].sort() }))
    .sort((a, b) => compareCompNames(a.display, b.display));
}

// Resolves a team filter value (canonical display name or a season-specific
// name, so old ?team= links keep working) to its identity.
export function findTeamIdentity(
  identities: TeamIdentity[],
  value: string
): TeamIdentity | undefined {
  return identities.find(
    (identity) => identity.display === value || identity.names.includes(value)
  );
}

export const ALL = 'All';

const SEVENS_PATTERN = /\b7s\b|7's|sevens/i;

// Sevens tournaments (e.g. "MAC 7s - S'kill 7's") are a different game and
// stay off the league board entirely.
export function isSevensComp(compName: string): boolean {
  return SEVENS_PATTERN.test(compName || '');
}

// Division prestige rank from the comp name: D1 -> 1, D2 -> 2, ... comps
// without a division number (tournaments, crossovers) sort last.
export function divisionRank(compName: string): number {
  const match = (compName || '').match(/D(\d+)/i);
  return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
}

// D1 first working down, alphabetical within a division.
export function compareCompNames(a: string, b: string): number {
  return divisionRank(a) - divisionRank(b) || a.localeCompare(b);
}

export function seasonsOf(fixtures: CapitalFixture[]): string[] {
  return [...new Set(fixtures.map((fixture) => fixture.season))]
    .filter(Boolean)
    .sort()
    .reverse();
}

export interface CompOption {
  compId: string;
  compName: string;
}

export function compsOf(fixtures: CapitalFixture[], season: string): CompOption[] {
  const seen = new Map<string, string>();
  for (const fixture of fixtures) {
    if (
      (season === ALL || fixture.season === season) &&
      fixture.compId &&
      !isSevensComp(fixture.compName)
    ) {
      if (!seen.has(fixture.compId)) {
        seen.set(fixture.compId, fixture.compName);
      }
    }
  }
  return [...seen.entries()]
    .map(([compId, compName]) => ({ compId, compName }))
    .sort((a, b) => compareCompNames(a.compName, b.compName));
}

export function teamsOf(
  fixtures: CapitalFixture[],
  season: string,
  compId: string
): string[] {
  const teams = new Set<string>();
  for (const fixture of fixtures) {
    if (
      (season === ALL || fixture.season === season) &&
      (compId === ALL || fixture.compId === compId)
    ) {
      if (fixture.homeTeam?.name) {
        teams.add(fixture.homeTeam.name);
      }
      if (fixture.awayTeam?.name) {
        teams.add(fixture.awayTeam.name);
      }
    }
  }
  return [...teams].sort((a, b) => a.localeCompare(b));
}

export function filterFixtures(
  fixtures: CapitalFixture[],
  filters: FixtureFilters
): CapitalFixture[] {
  const teams = Array.isArray(filters.team) ? filters.team : [filters.team];
  return fixtures.filter(
    (fixture) =>
      (filters.season === ALL || fixture.season === filters.season) &&
      (filters.compId === ALL || fixture.compId === filters.compId) &&
      (teams.includes(ALL) ||
        teams.includes(fixture.homeTeam?.name) ||
        teams.includes(fixture.awayTeam?.name))
  );
}

export function isResult(fixture: CapitalFixture): boolean {
  return (
    fixture.homeTeam?.score !== undefined &&
    fixture.homeTeam?.score !== '' &&
    fixture.awayTeam?.score !== undefined &&
    fixture.awayTeam?.score !== ''
  );
}

export function resultsOf(fixtures: CapitalFixture[]): CapitalFixture[] {
  return fixtures
    .filter(isResult)
    .sort(
      (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
    );
}

export function upcomingOf(fixtures: CapitalFixture[]): CapitalFixture[] {
  return fixtures
    .filter((fixture) => !isResult(fixture))
    .sort(
      (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
    );
}

// Newest season that has at least one result, so the standings tab lands on
// a table with data instead of an unplayed future season.
export function defaultSeason(fixtures: CapitalFixture[]): string {
  const seasons = seasonsOf(fixtures);
  for (const season of seasons) {
    if (fixtures.some((fixture) => fixture.season === season && isResult(fixture))) {
      return season;
    }
  }
  return seasons[0] ?? '';
}

// Groups fixtures by calendar day, then by division within each day.
// Date order follows the incoming order (resultsOf = newest first,
// upcomingOf = soonest first); divisions sort alphabetically.
export interface FixtureDivisionGroup {
  compName: string;
  fixtures: CapitalFixture[];
}

export interface FixtureDateGroup {
  dateKey: string;
  label: string;
  divisions: FixtureDivisionGroup[];
}

function dateKeyOf(dateTime: string): string {
  const date = new Date(dateTime);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function groupFixturesByDate(fixtures: CapitalFixture[]): FixtureDateGroup[] {
  const days = new Map<string, CapitalFixture[]>();
  for (const fixture of fixtures) {
    const key = dateKeyOf(fixture.dateTime);
    const day = days.get(key);
    if (day) {
      day.push(fixture);
    } else {
      days.set(key, [fixture]);
    }
  }
  return [...days.entries()].map(([dateKey, day]) => {
    const label = new Date(day[0].dateTime).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const divisions = new Map<string, CapitalFixture[]>();
    for (const fixture of day) {
      const compName = fixture.compName || 'Other';
      const division = divisions.get(compName);
      if (division) {
        division.push(fixture);
      } else {
        divisions.set(compName, [fixture]);
      }
    }
    return {
      dateKey,
      label,
      divisions: [...divisions.entries()]
        .map(([compName, items]) => ({ compName, fixtures: items }))
        .sort((a, b) => compareCompNames(a.compName, b.compName)),
    };
  });
}

// First fixture of a competition/season, used as the CompInput key for the
// official ladder query (any fixture in the comp resolves the same ladder).
export function ladderKeyFor(
  fixtures: CapitalFixture[],
  compId: string,
  season: string
): LadderKey | null {
  const fixture = fixtures.find(
    (item) => item.compId === compId && (season === ALL || item.season === season)
  );
  if (!fixture) {
    return null;
  }
  return {
    compId: fixture.compId,
    season: fixture.season,
    fixtureId: fixture.id,
    sourceType: fixture.sourceType || '2',
  };
}
