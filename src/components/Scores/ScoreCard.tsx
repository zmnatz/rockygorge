import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import type { Team } from '@/types/match';
import type { Score } from './types';

interface ScoreCardProps {
  score: Score;
}

export function ScoreCard({ score }: ScoreCardProps) {
  return (
    <Link href={`/games/${score.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <Card
        className="score-card"
        sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
      >
        <CardContent
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <TeamScore team={score.awayTeam} score={score.awayTeam.score} align="right" />

          <Typography
            variant="h6"
            sx={{ mx: 3, color: 'text.secondary', fontWeight: 'bold' }}
          >
            vs
          </Typography>

          <TeamScore team={score.homeTeam} score={score.homeTeam.score} align="left" />
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

interface TeamScoreProps {
  team: Team;
  score: string;
  align: 'left' | 'right';
}

function TeamScore({ team, score, align }: TeamScoreProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        flex: 1,
        flexDirection: align === 'left' ? 'row' : 'row-reverse',
        justifyContent: align === 'left' ? 'flex-start' : 'flex-end',
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
        {score}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {team.crest && (
          <Box
            component="img"
            src={team.crest}
            alt={team.name}
            sx={{ width: 40, height: 40, objectFit: 'contain', mb: 0.5 }}
          />
        )}
        <Typography
          variant="caption"
          sx={{ fontWeight: 'medium', textAlign: 'center', lineHeight: 1.2 }}
        >
          {team.name}
        </Typography>
      </Box>
    </Box>
  );
}
