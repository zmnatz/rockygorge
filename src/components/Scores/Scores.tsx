import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { useScores } from '@/api/scores';
import type { Score } from './types';
import { ScoreCard } from './ScoreCard';

// Latest games in a static grid — no carousel. Counts per breakpoint:
// xs: 2 games (1 column x 2 rows), sm+: 4 games (2 x 2). Capped at two
// per row so cards stay wide enough for matchup text. Extra cards hide
// via CSS (not JS breakpoints) so server and client render identically
// with no hydration flash.
const MAX_GAMES = 4;
const XS_GAMES = 2;

export function Scores({ initialScores }: { initialScores?: Score[] }) {
  const { data: scores, isLoading } = useScores(initialScores);

  if (isLoading || !scores || scores.length === 0) {
    return null;
  }

  const visible = scores.slice(0, MAX_GAMES);

  return (
    <Box sx={{ mt: 2, maxWidth: '100%' }}>
      <Grid container spacing={2} columns={{ xs: 1, sm: 2 }} sx={{ justifyContent: 'center' }}>
        {visible.map((score, index) => (
          <Grid
            key={score.id}
            size={{ xs: 1, sm: 1 }}
            sx={index >= XS_GAMES ? { display: { xs: 'none', sm: 'block' } } : undefined}
          >
            <ScoreCard score={score} compact />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
