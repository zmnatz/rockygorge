import { useQuery } from "@tanstack/react-query"
import { postWithRetry } from "@/utils/api"
import type { Score } from '@/components/Scores/types'

const SCORES_URL = 'https://rugby-au-cms.graphcdn.app';

const CLUB_NAME = 'Rocky Gorge';

const SCORES_QUERY = `query MatchCardsEntityPollQuery($entityId: Int, $entityType: String, $type: String, $skip: Int, $limit: Int) {
  getEntityFixturesAndResults(
    type: $type
    entityId: $entityId
    entityType: $entityType
    limit: $limit
    skip: $skip
  ) {
    ...Fixtures_fixture
    __typename
  }
}

fragment Fixtures_fixture on FixtureItem {
  id
  compId
  compName
  dateTime
  group
  isLive
  isBye
  round
  roundType
  roundLabel
  season
  status
  venue
  sourceType
  matchLabel
  homeTeam {
    ...Fixtures_team
    __typename
  }
  awayTeam {
    ...Fixtures_team
    __typename
  }
  fixtureMeta {
    ...Fixtures_meta
    __typename
  }
  __typename
}

fragment Fixtures_team on Team {
  id
  name
  teamId
  score
  crest
  __typename
}

fragment Fixtures_meta on Fixture {
  id
  ticketURL
  ticketsAvailableDate
  isSoldOut
  radioURL
  radioStart
  radioEnd
  streamURL
  streamStart
  streamEnd
  broadcastPartners {
    ...Fixtures_broadcastPartners
    __typename
  }
  __typename
}

fragment Fixtures_broadcastPartners on BroadcastPartner {
  id
  name
  link
  photoId
  __typename
}`;

export async function fetchLiveScores(): Promise<Score[]> {
  const data = await postWithRetry<{ data: { getEntityFixturesAndResults: Score[] } }>(SCORES_URL, {
    operationName: "MatchCardsEntityPollQuery",
    variables: {
      entityId: 91273,
      entityType: "club",
      type: "all",
      skip: 0,
      limit: 50,
    },
    query: SCORES_QUERY,
  });
  return data.data.getEntityFixturesAndResults
    .filter(
      (score) =>
        (score.homeTeam.name.includes(CLUB_NAME) ||
          score.awayTeam.name.includes(CLUB_NAME)) &&
        score.homeTeam.score.length > 0 &&
        score.awayTeam.score.length > 0
    )
    .sort(
      (a, b) =>
        new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
    );
}

async function fetchStaticScores(): Promise<Score[]> {
  try {
    const res = await fetch('/data/scores.json');
    if (!res.ok) {
      return [];
    }
    const json = await res.json();
    return Array.isArray(json) ? (json as Score[]) : [];
  } catch {
    // No prebuilt index (e.g. dev before first generate) — live fills in.
    return [];
  }
}

// Merges live results over the prebuilt index: live wins on duplicate ids,
// static-only games are retained, newest first. Used so the ticker renders
// instantly from the build-time snapshot, then fills in newer games.
export function mergeScores(live: Score[], stat: Score[]): Score[] {
  const seen = new Set(live.map((score) => score.id));
  const merged = [...live];
  for (const score of stat) {
    if (!seen.has(score.id)) {
      merged.push(score);
    }
  }
  return merged.sort(
    (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
  );
}

export function useScores(initialScores?: Score[]) {
  const staticQuery = useQuery({
    queryKey: ['scores-static'],
    queryFn: fetchStaticScores,
    initialData: initialScores,
    staleTime: Infinity,
    placeholderData: [],
  });
  const staticScores = staticQuery.data ?? [];
  return useQuery({
    queryKey: ['scores'],
    queryFn: async () => {
      try {
        const live = await fetchLiveScores();
        return mergeScores(live, staticScores);
      } catch (error) {
        console.info('Unable to load scores', error);
        return staticScores;
      }
    },
    initialData: staticScores,
    enabled: !staticQuery.isPending,
    staleTime: 5 * 60 * 1000,
  });
}
