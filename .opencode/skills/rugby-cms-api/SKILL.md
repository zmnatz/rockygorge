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
Individual game details (fixture, commentary, player lineups) come from the
same CMS endpoint via a `CompInput`-keyed match centre query.

### GraphQL Query
```graphql
query MatchCentreQuery($comp: CompInput) {
  getFixtureItem(comp: $comp) {
    id
    compId
    compName
    dateTime
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
}
```

### CompInput Keying
`CompInput` is `{ id, season, fixture, sourceType }` (all strings):

- `id`: the competition id (`compId` from the fixtures list, e.g. `wa2qruTx4gcHZLaHn`)
- `season`: the season string exactly as listed (e.g. `2025/2026`)
- `fixture`: the fixture id (e.g. `f2989ffad89ae4b2d`)
- `sourceType`: required — e.g. `2`. Omitting it resolves to `null`.

Resolve these keys from `getEntityFixturesAndResults` first (it returns
`compId`, `season`, `sourceType` per fixture), then issue the match centre
query. Example variables:

```json
{
  "comp": {
    "id": "wa2qruTx4gcHZLaHn",
    "season": "2025/2026",
    "fixture": "f2989ffad89ae4b2d",
    "sourceType": "2"
  }
}
```

### Notes
- `MatchCommentary` exposes no team side — only `id`, `minute`, `type`,
  `comment`. Derive home/away by matching roster names against the event text.
- There are no player-level query fields (`getPlayer`, `allPlayers`, etc. do
  not exist; `allSeasonStat` resolves empty). Player history is aggregated
  from match-centre data instead: CMS player ids are stable across fixtures
  with the shirt number appended (`<base>__<shirt>`), so the id base
  identifies a player over time. See `src/utils/playerHistory.ts`.
- Do NOT scrape `xplorer.rugby` `_next/data` JSON for this. That host sits
  behind a Vercel security checkpoint (HTTP 429 for automated clients), so a
  same-origin proxy can never work reliably. Use this CMS query instead.

