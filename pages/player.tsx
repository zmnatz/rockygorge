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
import { PlayerEligibilityDialog } from '@/components/PlayerEligibilityDialog';
import { clubPages } from '@/utils/clubPages';
import type { Club, PlayerEligibility } from '@/types/eligibility';
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
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 8 }}>
          No history found for this player.
        </Typography>
      )}

      {playerId && history && <PlayerHistoryView history={history} />}
    </Box>
  );
}

/** The player's current-season verdicts as chips, from the nightly record. Each
 *  opens the round-by-round detail. */
function SeasonEligibility({ playerId }: { playerId: string }) {
  const [open, setOpen] = useState<{ verdict: PlayerEligibility; club: Club } | null>(null);
  const { data } = useQuery({
    queryKey: ['playerEligibility', playerId],
    queryFn: async () => {
      const [snapshot, fixtures] = await Promise.all([
        loadParticipationSnapshot(),
        loadCurrentSeasonFixtures(),
      ]);
      if (!snapshot) return null;
      return {
        snapshot,
        fixtures,
        clubs: playerSeasonEligibility(snapshot, fixtures, playerId, eligibility),
      };
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  if (!data || data.clubs.length === 0) return null;
  const gaps = open ? clubGaps(data.snapshot, open.club, eligibility).length : 0;

  return (
    <>
      {data.clubs.flatMap(({ club, verdicts }) =>
        verdicts.map((verdict) => (
          <EligibilityStatusChip
            key={verdict.teamName}
            player={verdict}
            sideLabel={club.sides.find((side) => side.teamName === verdict.teamName)?.label}
            onClick={() => setOpen({ verdict, club })}
          />
        ))
      )}
      <PlayerEligibilityDialog
        player={open?.verdict ?? null}
        source="record"
        ownLabel={open?.club.sides.find((side) => side.teamName === open.verdict.teamName)?.label ?? ''}
        accounting={
          open && {
            snapshot: data.snapshot,
            fixtures: data.fixtures,
            clubSlug: clubPages[open.club.name]?.slug ?? null,
            sides: open.club.sides.map((side) => side.teamName),
          }
        }
        schedule={
          open && {
            club: open.club,
            fixtures: data.fixtures,
            clubSlug: clubPages[open.club.name]?.slug ?? null,
          }
        }
        footer={
          <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1, mb: 0 }}>
            {gaps > 0 &&
              `${gaps} ${gaps === 1 ? 'match has' : 'matches have'} gaps in this club's record, so counts may be low. `}
            {data.snapshot.season} season, as of{' '}
            {data.snapshot.generatedAt ? new Date(data.snapshot.generatedAt).toLocaleDateString() : 'the last update'}. A
            guide from the match record: the Rugby Xplorer report is the official count, and registration isn&apos;t
            checked.{' '}
            <MuiLink component={Link} href="/utils/eligibility-methodology">
              How it&apos;s worked out
            </MuiLink>
          </Typography>
        }
        onClose={() => setOpen(null)}
      />
    </>
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
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="subtitle1" color="text.secondary">
            {history.teamName} • {history.games.length}{' '}
            {history.games.length === 1 ? 'game' : 'games'} •{' '}
            {history.scoringEvents.length}{' '}
            {history.scoringEvents.length === 1 ? 'score' : 'scores'}
          </Typography>
          <SeasonEligibility playerId={history.id} />
        </Box>
      </Box>

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
