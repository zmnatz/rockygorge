import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { Link as MuiLink } from '@mui/material';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import { visuallyHidden } from '@mui/utils';
import { useQuery } from '@tanstack/react-query';
import { loadCurrentSeasonFixtures } from '@/api/capital';
import { EligibilityStatusChip } from '@/components/EligibilityStatusChip';
import {
  loadPlayerHistory,
  type PlayerHistory,
} from '@/utils/playerHistory';
import { clubGaps, loadParticipationSnapshot, playerSeasonEligibility } from '@/utils/participation';
import eligibility from '@config/eligibility.yml';

export default function PlayersPage() {
  const router = useRouter();
  const { id } = router.query;
  const playerId = typeof id === 'string' ? id : undefined;

  const {
    data: history,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['playerHistory', playerId],
    enabled: !!playerId,
    queryFn: () => loadPlayerHistory(playerId as string),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  return (
    <Box sx={{ py: 4, px: 2, maxWidth: 900, mx: 'auto' }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <MuiLink component={Link} href="/" underline="hover" color="inherit">
          Home
        </MuiLink>
        <Typography color="text.primary">
          {history ? history.name : 'Player'}
        </Typography>
      </Breadcrumbs>

      {!playerId && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          No player selected.
        </Typography>
      )}

      {playerId && isPending && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 8 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Loading history…
          </Typography>
        </Box>
      )}

      {playerId && !isPending && isError && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 8 }}>
          <Typography variant="body2" color="text.secondary">
            Failed to load player history.
          </Typography>
          <Button variant="outlined" onClick={() => refetch()}>
            Retry
          </Button>
        </Box>
      )}

      {playerId && !isPending && !isError && !history && (
        <>
          {/* History files cover Rocky Gorge's competitions; the record covers every club. */}
          <SeasonEligibility playerId={playerId} showName />
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 8 }}>
            No match history page for this player.
          </Typography>
        </>
      )}

      {playerId && history && <PlayerHistoryView history={history} />}
    </Box>
  );
}

/** The player's current-season verdicts, from the nightly record. */
function SeasonEligibility({ playerId, showName = false }: { playerId: string; showName?: boolean }) {
  const { data, isPending, isError } = useQuery({
    queryKey: ['playerEligibility', playerId],
    queryFn: async () => {
      const [snapshot, fixtures] = await Promise.all([
        loadParticipationSnapshot(),
        loadCurrentSeasonFixtures(),
      ]);
      if (!snapshot) return null;
      return {
        snapshot,
        clubs: playerSeasonEligibility(snapshot, fixtures, playerId, eligibility),
      };
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  if (isPending) return null;
  const name = showName ? data?.clubs[0]?.verdicts[0]?.name : undefined;
  const gapCount = data
    ? data.clubs.reduce((total, { club }) => total + clubGaps(data.snapshot, club, eligibility).length, 0)
    : 0;

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 4 }} data-testid="season-eligibility">
      {name && (
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
          {name}
        </Typography>
      )}
      <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
        {data ? `${data.snapshot.season} eligibility` : 'Eligibility'}
      </Typography>
      {(isError || !data) && (
        <Typography variant="body2" color="text.secondary">
          Eligibility is unavailable right now.
        </Typography>
      )}
      {data?.clubs.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No NCS Qualifying Matches recorded this season.
        </Typography>
      )}
      {data?.clubs.flatMap(({ verdicts }) => verdicts).map((verdict) => (
        <Box key={verdict.teamName} sx={{ mt: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {verdict.teamName}
            </Typography>
            <EligibilityStatusChip player={verdict} />
            <Typography variant="caption" color="text.secondary">
              {verdict.participation} {verdict.participation === 1 ? 'match' : 'matches'} for this side
            </Typography>
          </Box>
          {[...verdict.reasons, ...verdict.pending].map((note) => (
            <Typography key={note} variant="body2" color="text.secondary">
              {note}
            </Typography>
          ))}
        </Box>
      ))}
      {gapCount > 0 && (
        <Typography variant="body2" color="warning.main" sx={{ mt: 1.5 }}>
          {gapCount} {gapCount === 1 ? 'match has' : 'matches have'} gaps in this club&apos;s
          record, so this count may be low. The eligibility report lists them.
        </Typography>
      )}
      {data && (
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5, mb: 0 }}>
          A guide from the match record
          {data.snapshot.generatedAt &&
            `, as of ${new Date(data.snapshot.generatedAt).toLocaleDateString()}`}
          . The Rugby Xplorer report is the official count, and registration isn&apos;t checked.{' '}
          <MuiLink component={Link} href="/utils/eligibility">
            Eligibility report
          </MuiLink>
          {' · '}
          <MuiLink component={Link} href="/utils/eligibility-methodology">
            How it&apos;s worked out
          </MuiLink>
        </Typography>
      )}
    </Paper>
  );
}

function PlayerHistoryView({ history }: { history: PlayerHistory }) {
  const [season, setSeason] = useState<string>('all');
  const seasons = useMemo(
    () =>
      [...new Set(history.games.map((game) => game.season))].sort().reverse(),
    [history]
  );
  const visibleGames =
    season === 'all'
      ? history.games
      : history.games.filter((game) => game.season === season);
  const visibleEvents =
    season === 'all'
      ? history.scoringEvents
      : history.scoringEvents.filter((event) => event.season === season);

  return (
    <>
      <Head>
        <title>{history.name} | Rocky Gorge Rugby</title>
        <meta
          name="description"
          content={`${history.name} (${history.teamName}): ${history.games.length} games played and ${history.scoringEvents.length} scoring events.`}
        />
      </Head>
      <Typography variant="h4" component="h1" sx={visuallyHidden}>
        {history.name}
      </Typography>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }} aria-hidden="true">
          {history.name}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {history.teamName} • {history.games.length}{' '}
          {history.games.length === 1 ? 'game' : 'games'} •{' '}
          {history.scoringEvents.length}{' '}
          {history.scoringEvents.length === 1 ? 'score' : 'scores'}
        </Typography>
      </Box>

      <SeasonEligibility playerId={history.id} />

      <Tabs
        value={season}
        onChange={(_event, value) => setSeason(value)}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="Seasons"
        sx={{ mb: 3 }}
      >
        <Tab label={`All (${history.games.length})`} value="all" />
        {seasons.map((seasonName) => (
          <Tab
            key={seasonName}
            label={`${seasonName} (${history.games.filter((game) => game.season === seasonName).length})`}
            value={seasonName}
          />
        ))}
      </Tabs>

      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
        Games Played
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 4 }}>
        {visibleGames.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No games recorded.
          </Typography>
        )}
        {visibleGames.map((game) => (
          <MuiLink
            key={game.fixtureId}
            component={Link}
              href={`/game?id=${game.fixtureId}`}
            underline="none"
            color="inherit"
          >
            <Paper
              variant="outlined"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 1.5,
                '&:hover': { boxShadow: 1 },
              }}
            >
              <Chip
                label={game.result}
                size="small"
                color={
                  game.result === 'W'
                    ? 'success'
                    : game.result === 'L'
                      ? 'error'
                      : 'default'
                }
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }} noWrap>
                  vs {game.opponent}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {game.compName} •{' '}
                  {new Date(game.dateTime).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}
              >
                {game.scoreFor} - {game.scoreAgainst}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ whiteSpace: 'nowrap' }}
              >
                {game.coach
                  ? 'Coach'
                  : game.starter
                    ? 'Started'
                    : game.played
                      ? 'Sub (Played)'
                      : 'Sub (DNP)'}
              </Typography>
            </Paper>
          </MuiLink>
        ))}
      </Box>

      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
        Scoring Events
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {visibleEvents.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No scoring events recorded.
          </Typography>
        )}
        {visibleEvents.map((event) => (
          <MuiLink
            key={event.id}
            component={Link}
              href={`/game?id=${event.fixtureId}`}
            underline="none"
            color="inherit"
          >
            <Paper
              variant="outlined"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 1.5,
                '&:hover': { boxShadow: 1 },
              }}
            >
              <Typography
                variant="body2"
                sx={{ minWidth: 48, fontWeight: 'bold', textAlign: 'center' }}
              >
                {event.minute}&apos;
              </Typography>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2">{event.comment}</Typography>
                <Typography variant="caption" color="text.secondary">
                  vs {event.opponent} • {event.compName} •{' '}
                  {new Date(event.dateTime).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Typography>
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ whiteSpace: 'nowrap' }}
              >
                {event.type}
              </Typography>
            </Paper>
          </MuiLink>
        ))}
      </Box>
    </>
  );
}
