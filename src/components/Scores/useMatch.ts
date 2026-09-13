import { useQuery } from '@tanstack/react-query';
import type { MatchData } from '@/types/match';

const CLUB_SLUG = 'rocky-gorge-rugby';

// xplorer.rugby is a Next.js site and this build id rotates on every deploy.
// It is used as a first attempt, then refreshed from the live site when stale.
const FALLBACK_BUILD_ID = 'xPqU49OMRXdY91yiD34E3';

let cachedBuildId: string | undefined;

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
  });
}

async function fetchMatchData(matchId: string): Promise<MatchData> {
  const buildId = cachedBuildId ?? FALLBACK_BUILD_ID;
  let lineup = await fetchMatchTab(matchId, 'Player-Lineup', buildId);

  if (!lineup && buildId === FALLBACK_BUILD_ID) {
    const discovered = await discoverBuildId();
    if (discovered) {
      cachedBuildId = discovered;
      lineup = await fetchMatchTab(matchId, 'Player-Lineup', discovered);
    }
  }

  if (!lineup) {
    throw new Error('Failed to load match data');
  }

  const commentary = await fetchMatchTab(matchId, 'Commentary', cachedBuildId ?? FALLBACK_BUILD_ID);

  return {
    getFixtureItem: lineup.getFixtureItem,
    allMatchCommentary: commentary?.allMatchCommentary ?? [],
    allMatchStatsSummary: lineup.allMatchStatsSummary,
  };
}

async function fetchMatchTab(
  matchId: string,
  tab: string,
  buildId: string
): Promise<MatchData | null> {
  try {
    const url = `/rugby-data/_next/data/${buildId}/${CLUB_SLUG}/match-centre/${matchId}.json?tab=${tab}&club=${CLUB_SLUG}&comp=${matchId}`;
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    const json = await response.json();
    return json.pageProps?.matchData ?? json.matchData ?? null;
  } catch {
    return null;
  }
}

async function discoverBuildId(): Promise<string | null> {
  try {
    const response = await fetch(`/rugby-data/${CLUB_SLUG}/match-centre`);
    if (!response.ok) {
      return null;
    }
    const html = await response.text();
    const match = html.match(/\/_next\/static\/([^/"]+)\//);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
