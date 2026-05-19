import React, { useEffect, useRef, useState } from 'react';
import { Typography, Box, CircularProgress } from '@mui/material';
import { useScores } from './useScores';
import { ScoreCard } from './ScoreCard';

export default function Scores() {
  const scores = useScores();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (!hasInteracted || !scores || scores.length === 0) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 1) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: clientWidth / 2, behavior: 'smooth' });
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [scores, hasInteracted]);

  if (!scores) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (scores.length === 0) {
    return (
      <Box textAlign="center" p={4}>
        <Typography color="textSecondary">No recent scores available.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2, maxWidth: '100%', overflow: 'hidden' }}>
      <Box 
        ref={scrollRef}
        onMouseEnter={() => setHasInteracted(true)}
        onTouchStart={() => setHasInteracted(true)}
        onClick={() => setHasInteracted(true)}
        sx={{ 
          display: 'flex', 
          gap: 2, 
          overflowX: 'auto', 
          pb: 2, 
          px: 2,
          scrollBehavior: 'smooth',
          scrollSnapType: 'x mandatory',
          '&::-webkit-scrollbar': { display: 'none' },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          maxWidth: '100%',
        }}
      >
        {scores.map((score, index) => (
          <Box 
            key={index} 
            sx={{ 
              minWidth: { 
                xs: 'calc(100% - 32px)', 
                sm: 'calc((100% - 32px) / 2)', 
                md: 'calc((100% - 64px) / 3)' 
              }, 
              maxWidth: { 
                xs: 'calc(100% - 32px)', 
                sm: 'calc((100% - 32px) / 2)', 
                md: 'calc((100% - 64px) / 3)' 
              },
              flexShrink: 0,
              scrollSnapAlign: 'start'
            }}
          >
            <ScoreCard score={score} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
