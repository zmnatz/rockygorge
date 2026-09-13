import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { useScores } from '@/api/scores';
import { ScoreCard } from './ScoreCard';

const SCROLL_INTERVAL_MS = 8000;

export function Scores() {
  const { data: scores, isLoading } = useScores();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(media.matches);
    const handleChange = (event: MediaQueryListEvent) =>
      setPrefersReducedMotion(event.matches);
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!scores || scores.length === 0) return;
    if (isInteracting || prefersReducedMotion) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 1) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: clientWidth / 2, behavior: 'smooth' });
        }
      }
    }, SCROLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [scores, isInteracting, prefersReducedMotion]);

  if (isLoading || !scores || scores.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 2, maxWidth: '100%', overflow: 'hidden' }}>
      <Box
        ref={scrollRef}
        onMouseEnter={() => setIsInteracting(true)}
        onMouseLeave={() => setIsInteracting(false)}
        onTouchStart={() => setIsInteracting(true)}
        onTouchEnd={() => setIsInteracting(false)}
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
        {scores.map((score) => (
          <Box
            key={score.id}
            sx={{
              minWidth: {
                xs: 'calc(100% - 32px)',
                sm: 'calc((100% - 32px) / 2)',
                md: 'calc((100% - 64px) / 3)',
              },
              maxWidth: {
                xs: 'calc(100% - 32px)',
                sm: 'calc((100% - 32px) / 2)',
                md: 'calc((100% - 64px) / 3)',
              },
              flexShrink: 0,
              scrollSnapAlign: 'start',
            }}
          >
            <ScoreCard score={score} compact />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
