import { useEffect, useState } from "react"
import { Score } from './types'

export function useScores() {
  const [scores, setScores] = useState<Score[]>([])
  useEffect(() => {
    async function load() {
      setScores(await fetchScores());
    }
    load();
  }, [])
  return scores;
}

async function fetchScores() {
  try {
    const response = await fetch('https://rugby-au-cms.graphcdn.app', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
          operationName: "MatchCardsEntityPollQuery",
          variables:{
              "entityId":91273,
              "entityType":"club",
              "type":"all",
              "skip":0,
              "limit": 8
          },
          query: "query MatchCardsEntityPollQuery($entityId: Int, $entityType: String, $type: String, $skip: Int, $limit: Int) {\n  getEntityFixturesAndResults(\n    type: $type\n    entityId: $entityId\n    entityType: $entityType\n    limit: $limit\n    skip: $skip\n  ) {\n    ...Fixtures_fixture\n    __typename\n  }\n}\n\nfragment Fixtures_fixture on FixtureItem {\n  id\n  compId\n  compName\n  dateTime\n  group\n  isLive\n  isBye\n  round\n  roundType\n  roundLabel\n  season\n  status\n  venue\n  sourceType\n  matchLabel\n  homeTeam {\n    ...Fixtures_team\n    __typename\n  }\n  awayTeam {\n    ...Fixtures_team\n    __typename\n  }\n  fixtureMeta {\n    ...Fixtures_meta\n    __typename\n  }\n  __typename\n}\n\nfragment Fixtures_team on Team {\n  id\n  name\n  teamId\n  score\n  crest\n  __typename\n}\n\nfragment Fixtures_meta on Fixture {\n  id\n  ticketURL\n  ticketsAvailableDate\n  isSoldOut\n  radioURL\n  radioStart\n  radioEnd\n  streamURL\n  streamStart\n  streamEnd\n  broadcastPartners {\n    ...Fixtures_broadcastPartners\n    __typename\n  }\n  __typename\n}\n\nfragment Fixtures_broadcastPartners on BroadcastPartner {\n  id\n  name\n  link\n  photoId\n  __typename\n}"
      })
    });
    if (response.ok) {
      return (await response.json())?.data?.getEntityFixturesAndResults.filter(
        (score: Score) => score.homeTeam.score.length > 0 && score.awayTeam.score.length > 0
      )
    } else {
      console.info('Unable to load scores', response.status)
      return [];
    }
  } catch(error) {
    console.info(error);
    return []
  }
}