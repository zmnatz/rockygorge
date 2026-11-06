import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useCalendarSourceItems } from '@/api/calendar';
import { useGamedayFixtures } from '@/api/scores';
import { NextLinkComposed } from '@/utils/nextLink';
import matchesConfig from '@config/matches.yml';
import {
  assignMatchWindows,
  nextGamedayMatch,
  resolveGameday,
  resolveMatchLocation,
} from '@/utils/gameday';
import { ScoreCard } from './ScoreCard';
import type { Team } from '@/types/match';
import { formatStartDate } from '@/utils/calendar';
import type { Score } from './types';

const sides = matchesConfig.sides;

function preMatchTeam(name: string, crest = ''): Team {
  return { id: '', teamId: '', name, score: '', crest };
}

// Post-Gameday home preview: once the results window has passed, the next
// Gameday's first Side. Renders nothing while loading, on error, or when
// the Gameday page would not show a "next" day, so the home page is
// unchanged in those cases.
export function NextGameCard() {
  const fixturesQuery = useGamedayFixtures();
  const calendarQuery = useCalendarSourceItems();

  const match = useMemo(
    () => nextGamedayMatch(resolveGameday(fixturesQuery.data ?? [], sides)),
    [fixturesQuery.data]
  );
  const assignment = useMemo(
    () =>
      match
        ? assignMatchWindows([match], calendarQuery.data ?? [])[0]
        : undefined,
    [match, calendarQuery.data]
  );

  if (!match || calendarQuery.isPending) {
    return null;
  }

  const clubFixture = fixturesQuery.data?.find(
    (fixture) => fixture.id === match.fixture.id
  );
  const compName = clubFixture?.compName ?? match.side.compName;
  const score: Score = {
    id: match.fixture.id,
    dateTime: match.fixture.dateTime,
    compName,
    // Pre-match: no score.
    homeTeam: preMatchTeam(match.fixture.homeTeam.name, clubFixture?.homeTeam.crest),
    awayTeam: preMatchTeam(match.fixture.awayTeam.name, clubFixture?.awayTeam.crest),
  };

  return (
    <Box sx={{ width: '100%' }} data-testid="next-game-card">
      <Typography
        component={NextLinkComposed}
        href="/gameday"
        variant="h6"
        sx={{ display: 'block', mb: 1, color: 'inherit', textDecoration: 'underline' }}
      >
        Next game · {formatStartDate(assignment?.kickoff ?? match.fixture.dateTime)}
      </Typography>
      <ScoreCard
        score={score}
        kickoff={assignment?.kickoff}
        location={resolveMatchLocation(assignment?.item?.location, clubFixture?.venue)}
      />
    </Box>
  );
}
