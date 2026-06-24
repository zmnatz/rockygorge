import { useQuery } from "@tanstack/react-query";
import { MatchData } from "@/types/match";

export function useMatch(matchId: string) {
  return useQuery({
    queryKey: ["match", matchId],
    queryFn: async (): Promise<MatchData> => {
      // We use the Next.js data endpoint directly as it provides a clean JSON response
      // based on the provided example URL pattern.
      // Note: The buildId (xPqU49OMRXdY91yiD34E3) might change, but for now we use the provided one.
      const buildId = "xPqU49OMRXdY91yiD34E3";
      const url = `/rugby-data/_next/data/${buildId}/rocky-gorge-rugby/match-centre/${matchId}.json?tab=Player-Lineup&club=rocky-gorge-rugby&comp=${matchId}`;
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch match data: ${response.status} ${response.statusText}`);
      }
      const json = await response.json();
      
      // Handle both wrapped (pageProps) and unwrapped responses
      const matchData = json.pageProps?.matchData || json.matchData;
      
      if (!matchData) {
        throw new Error("Match data not found in response");
      }
      
      return matchData;
    },
    enabled: !!matchId,
  });
}
