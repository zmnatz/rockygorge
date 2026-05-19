import { useQuery } from "@tanstack/react-query";

export function useMatch(matchId: string) {
  return useQuery({
    queryKey: ["match", matchId],
    queryFn: async () => {
      // We use the Next.js data endpoint directly as it provides a clean JSON response
      // based on the provided example URL pattern.
      // Note: The buildId (xPqU49OMRXdY91yiD34E3) might change, but for now we use the provided one.
      const buildId = "xPqU49OMRXdY91yiD34E3";
      const url = `https://xplorer.rugby/_next/data/${buildId}/rocky-gorge-rugby/match-centre/${matchId}.json?tab=Player-Lineup&club=rocky-gorge-rugby&comp=${matchId}`;
      
      const response = await fetch(url);

      if (!response.ok) throw new Error("Failed to fetch match data");
      const json = await response.json();
      
      // Map the Next.js pageProps structure to a flat object for the page
      const pageProps = json.pageProps;
      const matchData = pageProps.matchData;
      
      return {
        getFixtureItem: matchData.getFixtureItem,
        allMatchCommentary: matchData.allMatchCommentary,
        allMatchStatsSummary: matchData.allMatchStatsSummary,
      };
    },
    enabled: !!matchId,
  });
}

            awayTeam {
              name
              score
              crest
            }
          }
          allMatchCommentary(fixtureId: $id) {
            minute
            type
            comment
            isHome
          }
          allMatchStatsSummary(fixtureId: $id) {
            lineUp {
              name
              position
              shirtNumber
              isHome
            }
            substitutes {
              name
              position
              shirtNumber
              isHome
            }
            coaches {
              name
              position
              isHome
            }
          }
        }`,
      }),

      });

      if (!response.ok) throw new Error("Failed to fetch match data");
      const json = await response.json();
      return json.data;
    },
    enabled: !!matchId,
  });
}
