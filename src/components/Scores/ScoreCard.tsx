import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { Crest } from '@/components/Crest';
import type { Score } from './types';

interface ScoreCardProps {
  score: Score;
  compact?: boolean;
  large?: boolean;
}

export function ScoreCard({ score, compact, large }: ScoreCardProps) {
  const homeScore = parseInt(score.homeTeam.score || '0', 10);
  const awayScore = parseInt(score.awayTeam.score || '0', 10);
  const homeWon = homeScore > awayScore;
  const awayWon = awayScore > homeScore;

  if (compact) {
    return (
      <Link
        href={`/game?id=${score.id}`}
        style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
      >
        <Card
          className="score-card"
          sx={{
            cursor: 'pointer',
            '&:hover': { boxShadow: 4 },
            // Theme adds side margins to cards below sm; inside the ticker
            // carousel spacing comes from the scroll container, not the card.
            mx: 0,
          }}
        >
          <CardContent
            sx={{
              px: { xs: 1.5, sm: 2 },
              py: 1,
              '&:last-child': { pb: 1 },
            }}
          >
            {/* Mobile (xs): stacked rows with winner highlight */}
            <Box sx={{ display: { xs: 'flex', sm: 'none' }, flexDirection: 'column', gap: 0.5 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontWeight: homeWon ? 'bold' : 'normal',
                }}
              >
                <Crest src={score.homeTeam.crest} alt="" />
                <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>
                  {score.homeTeam.name}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {score.homeTeam.score}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontWeight: awayWon ? 'bold' : 'normal',
                }}
              >
                <Crest src={score.awayTeam.crest} alt="" />
                <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>
                  {score.awayTeam.name}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {score.awayTeam.score}
                </Typography>
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textAlign: 'right' }}
                suppressHydrationWarning
              >
                {new Date(score.dateTime).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </Typography>
            </Box>

            {/* Desktop (sm+): original inline ticker */}
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, justifyContent: 'center' }}>
              <Box sx={{ minWidth: 0, maxWidth: '100%' }}>
                <Typography
                  variant="body2"
                  noWrap
                  sx={{
                    fontWeight: 'bold',
                    textAlign: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {score.homeTeam.name} vs {score.awayTeam.name}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mt: 0.5,
                  }}
                >
                  <Crest src={score.homeTeam.crest} alt="" />
                  <Typography variant="body2" sx={{ fontWeight: 'bold', flexShrink: 0 }}>
                    {score.homeTeam.score}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ flexShrink: 0 }}
                    suppressHydrationWarning
                  >
                    {new Date(score.dateTime).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', flexShrink: 0 }}>
                    {score.awayTeam.score}
                  </Typography>
                  <Crest src={score.awayTeam.crest} alt="" />
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Link>
    );
  }
  return (
    <Link href={`/game?id=${score.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', width: '100%' }}>
      <Card
        className="score-card"
        sx={{
          cursor: 'pointer',
          '&:hover': { boxShadow: 4 },
          width: '100% !important',
          maxWidth: 'none !important',
          mx: '0 !important',
        }}
      >
        {/* Mobile (xs): stacked rows with winner highlight */}
        <CardContent
          sx={{
            display: { xs: 'flex', sm: 'none' },
            flexDirection: 'column',
            gap: 1,
            px: 2,
            py: 1.5,
	    mx: 0,
            '&:last-child': { pb: 1.5 },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              fontWeight: homeWon ? 'bold' : 'normal',
              color: homeWon ? 'text.primary' : 'text.secondary',
            }}
          >
            <Crest
              src={score.homeTeam.crest}
              alt={score.homeTeam.name}
              size="md"
            />
            <Typography variant="body1" noWrap sx={{ flex: 1, minWidth: 0 }}>
              {score.homeTeam.name}
            </Typography>
            <Typography variant={large ? 'h5' : 'h6'} sx={{ fontWeight: 'bold' }}>
              {score.homeTeam.score}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              fontWeight: awayWon ? 'bold' : 'normal',
              color: awayWon ? 'text.primary' : 'text.secondary',
            }}
          >
            <Crest
              src={score.awayTeam.crest}
              alt={score.awayTeam.name}
              size="md"
            />
            <Typography variant="body1" noWrap sx={{ flex: 1, minWidth: 0 }}>
              {score.awayTeam.name}
            </Typography>
            <Typography variant={large ? 'h5' : 'h6'} sx={{ fontWeight: 'bold' }}>
              {score.awayTeam.score}
            </Typography>
          </Box>
        </CardContent>

        {/* Desktop (sm+): side by side */}
        <CardContent
          sx={{
            display: { xs: 'none', sm: 'flex' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            '&:last-child': { pb: 2 },
          }}
        >
          {/* Home team */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'row', sm: 'column' },
              alignItems: 'center',
              justifyContent: { xs: 'space-between', sm: 'center' },
              width: { xs: '100%', sm: 'auto' },
              flex: 1,
              minWidth: 0,
              gap: { xs: 1.5, sm: 0 },
            }}
          >
            <Crest
              src={score.homeTeam.crest}
              alt={score.homeTeam.name}
              size={large ? 'xl' : 'lg'}
            />
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: { xs: 'flex-start', sm: 'center' },
                minWidth: 0,
                flex: { xs: 1, sm: 'none' },
              }}
            >
              <Typography
                variant={large ? 'body1' : 'caption'}
                noWrap
                sx={{
                  fontWeight: 'medium',
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textAlign: { xs: 'left', sm: 'center' },
                  width: '100%',
                }}
              >
                {score.homeTeam.name}
              </Typography>
              <Typography
                variant={large ? 'h4' : 'h5'}
                sx={{ fontWeight: 'bold', fontSize: { xs: '1.5rem', sm: '2rem' } }}
              >
                {score.homeTeam.score}
              </Typography>
            </Box>
          </Box>

          <Typography
            variant={large ? 'h5' : 'h6'}
            sx={{
              color: 'text.secondary',
              fontWeight: 'bold',
              flexShrink: 0,
              my: { xs: -1, sm: 0 },
            }}
          >
            vs
          </Typography>

          {/* Away team */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'row-reverse', sm: 'column' },
              alignItems: 'center',
              justifyContent: { xs: 'space-between', sm: 'center' },
              width: { xs: '100%', sm: 'auto' },
              flex: 1,
              minWidth: 0,
              gap: { xs: 1.5, sm: 0 },
            }}
          >
            <Crest
              src={score.awayTeam.crest}
              alt={score.awayTeam.name}
              size={large ? 'xl' : 'lg'}
            />
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: { xs: 'flex-end', sm: 'center' },
                minWidth: 0,
                flex: { xs: 1, sm: 'none' },
              }}
            >
              <Typography
                variant={large ? 'body1' : 'caption'}
                noWrap
                sx={{
                  fontWeight: 'medium',
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textAlign: { xs: 'right', sm: 'center' },
                  width: '100%',
                }}
              >
                {score.awayTeam.name}
              </Typography>
              <Typography
                variant={large ? 'h4' : 'h5'}
                sx={{ fontWeight: 'bold', fontSize: { xs: '1.5rem', sm: '2rem' } }}
              >
                {score.awayTeam.score}
              </Typography>
            </Box>
          </Box>
        </CardContent>
        <Box sx={{ textAlign: 'center', pb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {score.compName} • {new Date(score.dateTime).toLocaleDateString()}
          </Typography>
        </Box>
      </Card>
    </Link>
  );
}
