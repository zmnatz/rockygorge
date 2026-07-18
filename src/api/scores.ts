import { useQuery } from "@tanstack/react-query"
import { post } from "@/utils/api"
import { Score } from '@/components/Scores/types'

const SCORES_URL = 'https://rugby-au-cms.graphcdn.app';

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

async function fetchScores() {
  try {
    const data = await post<{ data: { getEntityFixturesAndResults: Score[] } }>(SCORES_URL, {
      operationName: "MatchCardsEntityPollQuery",
      variables: {
        entityId: 91273,
        entityType: "club",
        type: "all",
        skip: 0,
        limit: 8,
      },
      query: SCORES_QUERY,
    });
    return data.data.getEntityFixturesAndResults.filter(
      (score) => score.homeTeam.score.length > 0 && score.awayTeam.score.length > 0
    );
  } catch (error) {
    console.info('Unable to load scores', error);
    return [];
  }
}

export function useScores() {
  const query = useQuery({
    queryKey: ['scores'],
    queryFn: fetchScores,
    placeholderData: []
  })
  return query.data;
}
