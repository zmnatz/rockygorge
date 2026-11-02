import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { ScoreCard } from '@/components/Scores/ScoreCard';
import type { MatchData } from '@/types/match';
import { MatchEvents } from './MatchEvents';
import { TeamPanel } from './TeamPanel';
import { isSubstitutionEvent, parseSubstitution, sortByShirtNumber } from './matchCentreUtils';

interface MatchCentreProps {
  data: MatchData;
  // Optional venue, forwarded to the score card's map dialog.
  location?: string;
  // Optional kickoff override, forwarded to the score card caption.
  kickoff?: string;
}

export function MatchCentre({ data, location, kickoff }: MatchCentreProps) {
  const { getFixtureItem: game, allMatchCommentary: events, allMatchStatsSummary: stats } = data;
  const lineup = sortByShirtNumber(stats?.lineUp?.players);
  const substitutes = sortByShirtNumber(stats?.lineUp?.substitutes);
  const coaches = stats?.lineUp?.coaches || [];
  const eventList = events || [];
  const substitutionCount = eventList.filter((event) =>
    isSubstitutionEvent(event.type)
  ).length;
  const cameOnNames = new Set(
    eventList.flatMap((event) => {
      const sub = isSubstitutionEvent(event.type)
        ? parseSubstitution(event.comment)
        : null;
      return sub ? [sub.on.toLowerCase()] : [];
    })
  );
  // Only dim unused substitutes when the feed actually contains substitution
  // data — otherwise every bench player would look like they didn't play.
  const substituteActiveNames = substitutionCount > 0 ? cameOnNames : undefined;

  return (
    <Box sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, md: 3 }, maxWidth: { xs: '100%', lg: 1400, xl: 1800 }, mx: 'auto' }}>
      <Grid container spacing={2} sx={{ justifyContent: 'center' }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Box sx={{ mb: 2, width: '100%' }}>
            <ScoreCard score={game} large location={location} kickoff={kickoff} />
          </Box>
          <Grid container spacing={2} sx={{ justifyContent: 'center' }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TeamPanel
                team={game.homeTeam}
                isHome
                lineup={lineup}
                substitutes={substitutes}
                coaches={coaches}
                substituteActiveNames={substituteActiveNames}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TeamPanel
                team={game.awayTeam}
                isHome={false}
                lineup={lineup}
                substitutes={substitutes}
                coaches={coaches}
                substituteActiveNames={substituteActiveNames}
              />
            </Grid>
          </Grid>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <MatchEvents game={game} events={eventList} />
        </Grid>
      </Grid>
    </Box>
  );
}
