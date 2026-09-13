import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import type { Score } from './types';

interface ScoreCardProps {
  score: Score;
  compact?: boolean;
  large?: boolean;
}

export function ScoreCard({ score, compact, large }: ScoreCardProps) {
  if (compact) {
    return (
      <Link href={`/games/${score.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <Card
          className="score-card"
          sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
        >
          <CardContent
            sx={{
              px: 2,
              py: 1,
              '&:last-child': { pb: 1 },
              display: 'flex',
              justifyContent: 'center',
            }}
          >
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
              {score.homeTeam.crest && (
                <Box
                  component="img"
                  src={score.homeTeam.crest}
                  alt=""
                  sx={{ width: 20, height: 20, objectFit: 'contain', flexShrink: 0 }}
                />
              )}
              <Typography variant="body2" sx={{ fontWeight: 'bold', flexShrink: 0 }}>
                {score.homeTeam.score}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                {new Date(score.dateTime).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', flexShrink: 0 }}>
                {score.awayTeam.score}
              </Typography>
              {score.awayTeam.crest && (
                <Box
                  component="img"
                  src={score.awayTeam.crest}
                  alt=""
                  sx={{ width: 20, height: 20, objectFit: 'contain', flexShrink: 0 }}
                />
              )}
            </Box>
          </Box>
          </CardContent>
        </Card>
      </Link>
    );
  }
  return (
    <Link href={`/games/${score.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <Card
        className="score-card"
        sx={{
          cursor: 'pointer',
          '&:hover': { boxShadow: 4 },
          width: '100%',
          maxWidth: 600,
          mx: 'auto',
        }}
      >
        <CardContent
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          {score.homeTeam.crest && (
            <Box
              component="img"
              src={score.homeTeam.crest}
              alt={score.homeTeam.name}
              sx={{
                width: large ? 76 : 56,
                height: large ? 76 : 56,
                objectFit: 'contain',
                flexShrink: 0,
              }}
            />
          )}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
                justifyContent: 'center',
                minWidth: 0,
                textAlign: 'center',
              }}
            >
              <Typography
                variant={large ? 'body1' : 'caption'}
                noWrap
                sx={{ fontWeight: 'medium', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {score.homeTeam.name}
            </Typography>
            <Typography variant={large ? 'h4' : 'h5'} sx={{ fontWeight: 'bold' }}>
              {score.homeTeam.score}
            </Typography>
          </Box>
          <Typography
            variant={large ? 'h5' : 'h6'}
            sx={{ color: 'text.secondary', fontWeight: 'bold', flexShrink: 0 }}
          >
            vs
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
                justifyContent: 'center',
                minWidth: 0,
                textAlign: 'center',
              }}
            >
              <Typography
                variant={large ? 'body1' : 'caption'}
                noWrap
                sx={{ fontWeight: 'medium', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {score.awayTeam.name}
            </Typography>
            <Typography variant={large ? 'h4' : 'h5'} sx={{ fontWeight: 'bold' }}>
              {score.awayTeam.score}
            </Typography>
          </Box>
          {score.awayTeam.crest && (
            <Box
              component="img"
              src={score.awayTeam.crest}
              alt={score.awayTeam.name}
              sx={{
                width: large ? 76 : 56,
                height: large ? 76 : 56,
                objectFit: 'contain',
                flexShrink: 0,
              }}
            />
          )}
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
