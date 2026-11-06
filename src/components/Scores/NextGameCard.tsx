import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import { useCalendarSourceItems } from '@/api/calendar';
import { scoreToClubFixture, useGamedayFixtures } from '@/api/scores';
import matchesConfig from '@config/matches.yml';
import {
  assignMatchWindows,
  nextGamedayMatch,
  resolveGameday,
  resolveMatchLocation,
} from '@/utils/gameday';
import { ScoreCard } from './ScoreCard';
import type { Team } from '@/types/match';
import type { Score } from './types';

const sides = matchesConfig.sides;

function preMatchTeam(name: string, crest = ''): Team {
  return { id: '', teamId: '', name, score: '', crest };
}

interface NextGameCardProps {
  // Build-time snapshot of club fixtures (results and upcoming). Seeds the
  // card so it renders with the page instead of waiting on the network.
  initialScores?: Score[];
  // When the snapshot was built. The first render judges "today" against
  // this so the client hydrates to exactly the static markup; a real clock
  // takes over right after mount.
  builtAt?: string;
}

// Post-Gameday home preview: once the results window has passed, the next
// Gameday's first Side. Renders nothing when the Gameday page would not
// show a "next" day, so the home page is unchanged in that case. The
// fixture comes from the cached snapshot, so the card and the results
// ticker appear and swap together with no flicker; only the kickoff time
// waits on the calendar.
export function NextGameCard({ initialScores, builtAt }: NextGameCardProps) {
  const seed = useMemo(
    () =>
      initialScores
        ?.map(scoreToClubFixture)
        .filter((fixture) => fixture !== null),
    [initialScores]
  );
  const fixturesQuery = useGamedayFixtures(seed);
  const calendarQuery = useCalendarSourceItems();

  const [now, setNow] = useState(() => (builtAt ? new Date(builtAt) : new Date()));
  useEffect(() => {
    setNow(new Date());
  }, []);

  const match = useMemo(
    () => nextGamedayMatch(resolveGameday(fixturesQuery.data ?? [], sides, now)),
    [fixturesQuery.data, now]
  );
  const assignment = useMemo(
    () =>
      match
        ? assignMatchWindows([match], calendarQuery.data ?? [])[0]
        : undefined,
    [match, calendarQuery.data]
  );

  if (!match) {
    return null;
  }

  const clubFixture = fixturesQuery.data?.find(
    (fixture) => fixture.id === match.fixture.id
  );
  const score: Score = {
    id: match.fixture.id,
    dateTime: match.fixture.dateTime,
    compName: clubFixture?.compName ?? match.side.compName,
    // Pre-match: no score.
    homeTeam: preMatchTeam(match.fixture.homeTeam.name, clubFixture?.homeTeam.crest),
    awayTeam: preMatchTeam(match.fixture.awayTeam.name, clubFixture?.awayTeam.crest),
  };

  return (
    <Box sx={{ width: '100%' }} data-testid="next-game-card">
      <ScoreCard
        score={score}
        kickoff={assignment?.kickoff}
        // The feed stamps placeholder times; hold the time back until the
        // calendar has the real kickoff rather than flash a wrong one.
        hideTime={calendarQuery.isPending}
        location={resolveMatchLocation(assignment?.item?.location, clubFixture?.venue)}
      />
    </Box>
  );
}
