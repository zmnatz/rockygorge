import { useQuery } from '@tanstack/react-query';
import { post } from '@/utils/api';
import { findFixtureById } from '@/utils/playerHistory';
import type { MatchData, MatchPlayer } from '@/types/match';

const SCORES_URL = 'https://rugby-au-cms.graphcdn.app';

const MATCH_CENTRE_QUERY = `query MatchCentreQuery($comp: CompInput) {
  getFixtureItem(comp: $comp) {
    id
    compId
    compName
    dateTime
    venue
    homeTeam {
      id
      name
      teamId
      score
      crest
      __typename
    }
    awayTeam {
      id
      name
      teamId
      score
      crest
      __typename
    }
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
      players {
        id
        name
        position
        shirtNumber
        isHome
        __typename
      }
      substitutes {
        id
        name
        position
        shirtNumber
        isHome
        __typename
      }
      coaches {
        id
        name
        position
        shirtNumber
        isHome
        __typename
      }
      __typename
    }
    __typename
  }
}`;

interface MatchCentreResponse {
  getFixtureItem: MatchData['getFixtureItem'] | null;
  allMatchCommentary:
    | { id: string; minute: string; type: string; comment: string }[]
    | null;
  allMatchStatsSummary: MatchData['allMatchStatsSummary'] | null;
}

export function useMatch(matchId: string | undefined) {
  return useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      if (!matchId) {
        throw new Error('Missing match id');
      }
      return fetchMatchData(matchId);
    },
    enabled: !!matchId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

async function fetchMatchData(matchId: string): Promise<MatchData> {
  const fixture = await findFixtureById(matchId);

  if (!fixture) {
    throw new Error('Failed to load match data');
  }

  const comp = {
    id: fixture.compId,
    season: fixture.season,
    fixture: fixture.id,
    sourceType: fixture.sourceType ?? '2',
  };

  const response = await post<{ data: MatchCentreResponse }>(SCORES_URL, {
    operationName: 'MatchCentreQuery',
    variables: { comp },
    query: MATCH_CENTRE_QUERY,
  });

  const { getFixtureItem, allMatchCommentary, allMatchStatsSummary } =
    response.data;

  if (!getFixtureItem) {
    throw new Error('Failed to load match data');
  }

  const lineUp = allMatchStatsSummary?.lineUp;
  const homeNames = collectNames(lineUp, true);
  const awayNames = collectNames(lineUp, false);

  return {
    getFixtureItem,
    allMatchCommentary: (allMatchCommentary ?? []).map((event) => ({
      ...event,
      isHome: deriveIsHome(event.comment, homeNames, awayNames),
    })),
    allMatchStatsSummary: allMatchStatsSummary ?? {
      lineUp: { players: [], substitutes: [], coaches: [] },
    },
  };
}

function collectNames(
  lineUp:
    | {
        players: MatchPlayer[];
        substitutes: MatchPlayer[];
        coaches: MatchPlayer[];
      }
    | undefined,
  isHome: boolean
): string[] {
  if (!lineUp) {
    return [];
  }
  return [...lineUp.players, ...lineUp.substitutes, ...lineUp.coaches]
    .filter((player) => player.isHome === isHome)
    .map((player) => player.name.toLowerCase());
}

// The CMS MatchCommentary type exposes no team side, so derive it by matching
// roster names against the event text.
function deriveIsHome(
  comment: string,
  homeNames: string[],
  awayNames: string[]
): boolean {
  const text = comment.toLowerCase();
  const homeHits = homeNames.filter((name) => name && text.includes(name)).length;
  const awayHits = awayNames.filter((name) => name && text.includes(name)).length;
  return homeHits > awayHits;
}
