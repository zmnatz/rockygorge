import React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import { Score, Team } from './types';

interface ScoreCardProps {
  score: Score;
}

export function ScoreCard({ score }: ScoreCardProps): JSX.Element {
  return (
    <Card className="score-card">
      <CardHeader title={score.compName} />
      <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <TeamBadge team={score.homeTeam} />
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6">
            {score.homeTeam.score} - {score.awayTeam.score}
          </Typography>
          <Typography variant="caption">
            {new Date(score.dateTime).toLocaleDateString()}
          </Typography>
        </Box>
        <TeamBadge team={score.awayTeam} />
      </CardContent>
    </Card>
  );
}

interface TeamBadge2Props {
  team: Team;
}

function TeamBadge2({ team }: TeamBadge2Props): JSX.Element {
  return <img height="40" src={team.crest} title={team.name} alt={team.name} />;
}

interface TeamBadgeProps {
  team: Team;
}

function TeamBadge({ team }: TeamBadgeProps): JSX.Element {
  return <img height="40" src={team.crest} title={team.name} alt={team.name} />;
}