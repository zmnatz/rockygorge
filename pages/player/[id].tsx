import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { Link as MuiLink } from '@mui/material';
import type { GetStaticPaths, GetStaticProps } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import { useMemo, useState } from 'react';
import { visuallyHidden } from '@mui/utils';
import { eligibilityPlayerUrl } from '@/utils/eligibilitySite';
import type { PlayerHistory } from '@/utils/playerHistory';
import { readPlayerHistory } from '@/utils/playerSnapshot';

// No player page is built: each is rendered from the player's committed snapshot on its
// first request and cached until the next deploy, which is when the nightly snapshots
// change (ADR 016). An id with no snapshot is a 404.
export const getStaticPaths: GetStaticPaths = async () => ({ paths: [], fallback: 'blocking' });

export const getStaticProps: GetStaticProps<{ history: PlayerHistory }> = async ({ params }) => {
  const history = typeof params?.id === 'string' ? await readPlayerHistory(params.id) : null;
  return history ? { props: { history } } : { notFound: true };
};

// Rendered on the server, so dates are in the club's time zone, not the server's.
const formatDate = (dateTime: string) =>
  new Date(dateTime).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  });

export default function PlayerPage({ history }: { history: PlayerHistory }) {
  return (
    <Box sx={{ py: 4, px: 2, maxWidth: 900, mx: 'auto' }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <MuiLink component={Link} href="/" underline="hover" color="inherit">
          Home
        </MuiLink>
        <Typography color="text.primary">{history.name}</Typography>
      </Breadcrumbs>
      <PlayerHistoryView history={history} />
    </Box>
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
        <title>{`${history.name} | Rocky Gorge Rugby`}</title>
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
        </Box>
        {history.eligibility && (
          <MuiLink
            href={eligibilityPlayerUrl(history.id)}
            target="_blank"
            rel="noopener noreferrer"
            variant="body2"
            sx={{ display: 'inline-block', mt: 1 }}
          >
            Eligibility report
          </MuiLink>
        )}
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
                  {formatDate(game.dateTime)}
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
                  {formatDate(event.dateTime)}
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
