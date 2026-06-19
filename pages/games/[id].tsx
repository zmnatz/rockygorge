import React from 'react';
import { useRouter } from 'next/router';
import { Grid, Typography, Box, Paper, Divider, CircularProgress } from '@mui/material';
import { useMatch } from '@/components/Scores/useMatch';
import { MatchPlayer } from '@/types/match';

export default function GamePage() {
  const router = useRouter();
  const { id } = router.query;

  const { data, isLoading, error } = useMatch(id as string);

  if (!id || isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Typography variant="h6">Game not found or failed to load.</Typography>
      </Box>
    );
  }

  const { getFixtureItem: game, allMatchCommentary: events, allMatchStatsSummary: stats } = data;

  const lineup = [...(stats?.lineUp?.players || [])].sort((a, b) => parseInt(a.shirtNumber || '0') - parseInt(b.shirtNumber || '0'));
  const substitutes = [...(stats?.lineUp?.substitutes || [])].sort((a, b) => parseInt(a.shirtNumber || '0') - parseInt(b.shirtNumber || '0'));
  const coaches = stats?.lineUp?.coaches || [];

  return (
    <Box sx={{ py: 4, px: 2, maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          {game.homeTeam.name} {game.homeTeam.score} - {game.awayTeam.score} {game.awayTeam.name}
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          {game.compName} • {new Date(game.dateTime).toLocaleDateString()} • {game.venue}
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ justifyContent: 'center' }}>
        {/* Home Team */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
            {game.homeTeam.name}
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper' }}>
            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>Starters</Typography>
            {lineup.filter(p => p.isHome).map((p: any, i: number) => (
              <Typography key={i} variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <span>{p.name}</span>
                <Typography variant="caption" color="textSecondary">{p.position}</Typography>
              </Typography>
            ))}
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>Substitutes</Typography>
            {substitutes.filter(p => p.isHome).map((p: any, i: number) => (
              <Typography key={i} variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <span>{p.name}</span>
                <Typography variant="caption" color="textSecondary">{p.position}</Typography>
              </Typography>
            ))}
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>Coaches</Typography>
            {coaches.filter(c => c.isHome).map((c: any, i: number) => (
              <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>
                {c.name}
              </Typography>
            ))}
          </Paper>
        </Grid>
        
        {/* Away Team */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
            {game.awayTeam.name}
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper' }}>
            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>Starters</Typography>
            {lineup.filter(p => !p.isHome).map((p: any, i: number) => (
              <Typography key={i} variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <span>{p.name}</span>
                <Typography variant="caption" color="textSecondary">{p.position}</Typography>
              </Typography>
            ))}
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>Substitutes</Typography>
            {substitutes.filter(p => !p.isHome).map((p: any, i: number) => (
              <Typography key={i} variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <span>{p.name}</span>
                <Typography variant="caption" color="textSecondary">{p.position}</Typography>
              </Typography>
            ))}
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>Coaches</Typography>
            {coaches.filter(c => !c.isHome).map((c: any, i: number) => (
              <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>
                {c.name}
              </Typography>
            ))}
          </Paper>
        </Grid>

        {/* Match Events */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>Match Events</Typography>
          <Divider sx={{ mb: 3 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {events.map((event: any, i: number) => (
              <Box key={i} sx={{ 
                display: 'flex', 
                mb: 2, 
                alignItems: 'center', 
                width: '100%', 
                maxWidth: 600,
                justifyContent: event.isHome ? 'flex-start' : 'flex-end',
                textAlign: event.isHome ? 'left' : 'right'
              }}>
                {event.isHome && <Typography variant="caption" sx={{ width: 40, fontWeight: 'bold', textAlign: 'right', mr: 2 }}>{event.minute}'</Typography>}
                <Typography variant="body2" sx={{ 
                  p: 1, 
                  borderRadius: 1, 
                  bgcolor: event.isHome ? 'primary.light' : 'grey.200',
                  color: event.isHome ? 'primary.contrastText' : 'text.primary',
                  flex: 1,
                  maxWidth: '80%'
                }}>
                  {event.comment}
                </Typography>
                {!event.isHome && <Typography variant="caption" sx={{ width: 40, fontWeight: 'bold', textAlign: 'left', ml: 2 }}>{event.minute}'</Typography>}
              </Box>
            ))}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}



