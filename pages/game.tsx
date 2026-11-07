import { useRouter } from 'next/router';
import Head from 'next/head';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import MuiLink from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { visuallyHidden } from '@mui/utils';
import { useMatch } from '@/components/Scores/useMatch';
import { MatchCentre } from '@/components/MatchCentre';
import { clubPages } from '@/utils/clubPages';
import { matchUrl } from '@/utils/rugbyXplorer';
import { parseTeamSide } from '@/utils/teamSide';

export default function GamePage() {
  const router = useRouter();
  const { id } = router.query;
  const matchId = typeof id === 'string' ? id : undefined;

  const { data, isLoading, error } = useMatch(matchId);

  if (!router.isReady || isLoading) {
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

  if (error || !data || !matchId) {
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

  const { getFixtureItem: game } = data;
  const homeClub = parseTeamSide(game.homeTeam.name)?.clubName;

  return (
    <>
      <Head>
        <title>
          {game.homeTeam.name} vs {game.awayTeam.name} | Rocky Gorge Rugby
        </title>
        <meta
          name="description"
          content={`${game.homeTeam.name} ${game.homeTeam.score} - ${game.awayTeam.score} ${game.awayTeam.name}: lineups, scores and match events.`}
        />
      </Head>
      <Typography variant="h4" component="h1" sx={visuallyHidden}>
        {game.homeTeam.name} vs {game.awayTeam.name}
      </Typography>
      <MatchCentre data={data} />
      <Box sx={{ textAlign: 'center', pb: 3 }}>
        <MuiLink
          variant="body2"
          href={matchUrl(game.id, clubPages[homeClub ?? '']?.slug ?? null)}
          target="_blank"
          rel="noopener noreferrer"
        >
          View this match on Rugby Xplorer
        </MuiLink>
      </Box>
    </>
  );
}
