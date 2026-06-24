import React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { Score } from './types';

interface ScoreCardProps {
  score: Score;
}

export function ScoreCard({ score }: ScoreCardProps) {
  const cleanTeamName = (name: string) => {
    return name.replace(/\s+(MD\d+|D\d+)\s*$/, '').trim();
  };

  return (
    <Link href={`/games/${score.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <Card className="score-card" sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flex: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: 2 }}>
              {score.awayTeam.crest && (
                <Box 
                  component="img" 
                  src={score.awayTeam.crest} 
                  alt={score.awayTeam.name} 
                  sx={{ width: 40, height: 40, objectFit: 'contain', mb: 0.5 }} 
                />
              )}
              <Typography variant="caption" sx={{ fontWeight: 'medium', textAlign: 'center', lineHeight: 1.2 }}>
                {cleanTeamName(score.awayTeam.name)}
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {score.awayTeam.score}
            </Typography>
          </Box>
          
          <Typography variant="h6" sx={{ mx: 3, color: 'text.secondary', fontWeight: 'bold' }}>
            vs
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {score.homeTeam.score}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', ml: 2 }}>
              {score.homeTeam.crest && (
                <Box 
                  component="img" 
                  src={score.homeTeam.crest} 
                  alt={score.homeTeam.name} 
                  sx={{ width: 40, height: 40, objectFit: 'contain', mb: 0.5 }} 
                />
              )}
              <Typography variant="caption" sx={{ fontWeight: 'medium', textAlign: 'center', lineHeight: 1.2 }}>
                {cleanTeamName(score.homeTeam.name)}
              </Typography>
            </Box>
          </Box>
        </CardContent>
        <Box sx={{ textAlign: 'center', pb: 2 }}>
          <Typography variant="caption" color="textSecondary">
            {score.compName} • {new Date(score.dateTime).toLocaleDateString()}
          </Typography>
        </Box>
      </Card>
    </Link>
  );
}
