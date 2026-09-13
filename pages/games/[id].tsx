import { useRouter } from 'next/router';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useMatch } from '@/components/Scores/useMatch';
import type { MatchPlayer, Team } from '@/types/match';

export default function GamePage() {
  const router = useRouter();
  const { id } = router.query;
  const matchId = typeof id === 'string' ? id : undefined;

  const { data, isLoading, error } = useMatch(matchId);

  if (!matchId || isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
        }}
      >
        <Typography variant="h6">Game not found or failed to load.</Typography>
      </Box>
    );
  }

  const { getFixtureItem: game, allMatchCommentary: events, allMatchStatsSummary: stats } = data;
  const lineup = sortByShirtNumber(stats?.lineUp?.players);
  const substitutes = sortByShirtNumber(stats?.lineUp?.substitutes);
  const coaches = stats?.lineUp?.coaches || [];
  const eventList = events || [];

  return (
    <Box sx={{ py: 4, px: 2, maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          {game.homeTeam.name} {game.homeTeam.score} - {game.awayTeam.score}{' '}
          {game.awayTeam.name}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {game.compName} • {new Date(game.dateTime).toLocaleDateString()} • {game.venue}
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ justifyContent: 'center' }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <TeamPanel
            team={game.homeTeam}
            isHome
            lineup={lineup}
            substitutes={substitutes}
            coaches={coaches}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <TeamPanel
            team={game.awayTeam}
            isHome={false}
            lineup={lineup}
            substitutes={substitutes}
            coaches={coaches}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
            Match Events
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {eventList.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No match events available.
              </Typography>
            )}
            {eventList.map((event, index) => {
              const isHome = event.isHome;
              return (
                <Box
                  // biome-ignore lint/suspicious/noArrayIndexKey: commentary events have no stable id exposed by the API
                  key={index}
                  sx={{
                    display: 'flex',
                    mb: 2,
                    alignItems: 'center',
                    width: '100%',
                    maxWidth: 600,
                    justifyContent: isHome ? 'flex-start' : 'flex-end',
                    textAlign: isHome ? 'left' : 'right',
                  }}
                >
                  {isHome && (
                    <Typography variant="caption" sx={{ width: 40, fontWeight: 'bold', textAlign: 'right', mr: 2 }}>
                      {event.minute}&apos;
                    </Typography>
                  )}
                  <Typography
                    variant="body2"
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      bgcolor: isHome ? 'primary.light' : 'grey.200',
                      color: isHome ? 'primary.contrastText' : 'text.primary',
                      flex: 1,
                      maxWidth: '80%',
                    }}
                  >
                    {event.comment}
                  </Typography>
                  {!isHome && (
                    <Typography variant="caption" sx={{ width: 40, fontWeight: 'bold', textAlign: 'left', ml: 2 }}>
                      {event.minute}&apos;
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

function sortByShirtNumber(players: MatchPlayer[] | undefined): MatchPlayer[] {
  return [...(players || [])].sort(
    (a, b) => parseInt(a.shirtNumber || '0', 10) - parseInt(b.shirtNumber || '0', 10)
  );
}

interface TeamPanelProps {
  team: Team;
  isHome: boolean;
  lineup: MatchPlayer[];
  substitutes: MatchPlayer[];
  coaches: MatchPlayer[];
}

function TeamPanel({ team, isHome, lineup, substitutes, coaches }: TeamPanelProps) {
  return (
    <>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
        {team.name}
      </Typography>
      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper' }}>
        <SectionLabel label="Starters" />
        <RosterList
          players={lineup.filter((player) => player.isHome === isHome)}
        />
        <Divider sx={{ my: 2 }} />
        <SectionLabel label="Substitutes" />
        <RosterList
          players={substitutes.filter((player) => player.isHome === isHome)}
        />
        <Divider sx={{ my: 2 }} />
        <SectionLabel label="Coaches" />
        {coaches
          .filter((coach) => coach.isHome === isHome)
          .map((coach, index) => (
            <Typography
              // biome-ignore lint/suspicious/noArrayIndexKey: roster players have no stable id exposed by the API
              key={index}
              variant="body2"
              sx={{ mb: 0.5 }}
            >
              {coach.name}
            </Typography>
          ))}
      </Paper>
    </>
  );
}

function RosterList({ players }: { players: MatchPlayer[] }) {
  return (
    <>
      {players.map((player, index) => (
        <Typography
          // biome-ignore lint/suspicious/noArrayIndexKey: roster players have no stable id exposed by the API
          key={index}
          variant="body2"
          sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}
        >
          <span>{player.name}</span>
          <Typography variant="caption" color="text.secondary">
            {player.position}
          </Typography>
        </Typography>
      ))}
    </>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
      {label}
    </Typography>
  );
}
