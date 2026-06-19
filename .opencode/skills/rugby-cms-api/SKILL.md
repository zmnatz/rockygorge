---
name: rugby-cms-api
description: Use ONLY when interacting with the rugby-au-cms.graphcdn.app GraphQL API to fetch rugby fixtures and results.
---

# Rugby CMS API Skill

This skill provides instructions and the GraphQL query needed to interact with the Rugby CMS API for fetching fixtures and results.

## API Endpoint
`https://rugby-au-cms.graphcdn.app`

## Fixtures and Results Query
Use the `MatchCardsEntityPollQuery` to retrieve fixtures and results for a specific entity (club or competition).

### GraphQL Query
```graphql
query MatchCardsEntityPollQuery($entityId: Int, $entityType: String, $type: String, $skip: Int, $limit: Int) {
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
}
```

### Example Variables
To fetch data for Rocky Gorge Rugby (Club ID: `91273`):
```json
{
  "entityId": 91273,
  "entityType": "club",
  "type": "all",
  "skip": 0,
  "limit": 50
}
```

## Usage Instructions
1. Send a `POST` request to the endpoint.
2. Include the `Content-Type: application/json; charset=utf-8` header.
3. Provide the `operationName`, `variables`, and `query` in the request body.

## Individual Game Data
Individual game details (e.g., Commentary, Player Lineups) are loaded from Next.js data JSON files.

### URL Pattern
`/rugby-data/_next/data/{buildId}/{clubSlug}/match-centre/{matchId}.json?tab={tab}&club={clubSlug}&comp={matchId}`

### Examples
- **Commentary**: `/rugby-data/_next/data/xPqU49OMRXdY91yiD34E3/rocky-gorge-rugby/match-centre/f2989ffad89ae4b2d.json?tab=Commentary&club=rocky-gorge-rugby&comp=f2989ffad89ae4b2d`
- **Player Lineup**: `/rugby-data/_next/data/xPqU49OMRXdY91yiD34E3/rocky-gorge-rugby/match-centre/f2989ffad89ae4b2d.json?tab=Player-Lineup&club=rocky-gorge-rugby&comp=f2989ffad89ae4b2d`

