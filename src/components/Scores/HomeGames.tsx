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
  toLocalDayKey,
} from '@/utils/gameday';
import { formatStartDate } from '@/utils/calendar';
import { NextLinkComposed } from '@/utils/nextLink';
import { ScoreCard } from './ScoreCard';
import { Scores } from './Scores';
import type { Team } from '@/types/match';
import type { Score } from './types';

const sides = matchesConfig.sides;

function preMatchTeam(name: string, crest = ''): Team {
  return { id: '', teamId: '', name, score: '', crest };
}

interface HomeGamesProps {
  // Build-time snapshot of club fixtures (results and upcoming). Seeds the
  // card so it renders with the page instead of waiting on the network.
  initialScores?: Score[];
  // When the snapshot was built. The first render judges "today" against
  // this so the client hydrates to exactly the static markup; a real clock
  // takes over right after mount.
  builtAt?: string;
}

// Home games section. Once the results window has passed, the next
// Gameday's first Side replaces the results ticker; otherwise (and when
// the Gameday page would not show a "next" day) the ticker shows. The
// fixture comes from the cached snapshot, so the card and the results
// ticker appear and swap together with no flicker; only the kickoff time
// waits on the calendar.
export function HomeGames({ initialScores, builtAt }: HomeGamesProps) {
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

  // Either/or: the next game replaces the results ticker. Both decide from
  // the same cached fixtures, so the swap never flickers.
  if (!match) {
    return <Scores initialScores={initialScores} />;
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
    // The whole card opens Gameday: a stretched link covers it, and the
    // venue button inside the card sits above the link so it still works.
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        '&:hover .score-card': { boxShadow: 4 },
      }}
      data-testid="next-game-card"
    >
      <Box
        component={NextLinkComposed}
        href="/gameday"
        aria-label="Open Gameday"
        sx={{ position: 'absolute', inset: 0, zIndex: 1, borderRadius: 1 }}
      />
      <ScoreCard
        score={score}
        kickoff={assignment?.kickoff}
        // The feed stamps placeholder times, so until the calendar has the
        // real kickoff the header shows the day alone rather than flash a
        // wrong time.
        header={`Next game · ${formatStartDate(
          calendarQuery.isPending
            ? toLocalDayKey(match.fixture.dateTime)
            : (assignment?.kickoff ?? match.fixture.dateTime)
        )}`}
        location={resolveMatchLocation(assignment?.item?.location, clubFixture?.venue)}
      />
    </Box>
  );
}
