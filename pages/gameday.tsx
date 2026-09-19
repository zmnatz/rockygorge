import { useMemo, useState } from 'react';
import Head from 'next/head';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { useCalendarSourceItems } from '@/api/calendar';
import { useGamedayFixtures, type ClubFixture } from '@/api/scores';
import { MatchCentre } from '@/components/MatchCentre';
import { useMatch } from '@/components/Scores/useMatch';
import matchesConfig from '@config/matches.yml';
import type { ResolvedGameday, SideMatch } from '@/types/gameday';
import {
  defaultSideIndex,
  matchCalendarItem,
  matchStatus,
  resolveGameday,
  resolveMatchLocation,
} from '@/utils/gameday';

const sides = matchesConfig.sides;

const PAGE_WIDTH = {
  px: { xs: 2, md: 3 },
  maxWidth: { xs: '100%', lg: 1400, xl: 1800 },
  mx: 'auto',
} as const;

const HEAD = (
  <Head>
    <title>Gameday | Rocky Gorge Rugby</title>
    <meta
      name="description"
      content="Rocky Gorge gameday: scores, lineups, and match events for the D1 and D3 sides, plus kickoff times and locations."
    />
  </Head>
);

export default function GamedayPage() {
  const fixturesQuery = useGamedayFixtures();

  const resolved = useMemo(
    () => resolveGameday(fixturesQuery.data ?? [], sides),
    [fixturesQuery.data]
  );

  return (
    <>
      {HEAD}
      {fixturesQuery.isPending && (
        <Centered>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Loading gameday…
          </Typography>
        </Centered>
      )}
      {fixturesQuery.isError && (
        <Centered>
          <Typography variant="h6">Gameday failed to load.</Typography>
        </Centered>
      )}
      {fixturesQuery.data && resolved.kind === 'none' && (
        <Box sx={{ ...PAGE_WIDTH, pt: { xs: 2, md: 4 }, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Gameday
          </Typography>
          <Typography variant="body1" color="text.secondary">
            No matches scheduled. Check back closer to the season.
          </Typography>
        </Box>
      )}
      {fixturesQuery.data && resolved.kind !== 'none' && (
        <GamedayDay
          key={resolved.date}
          fixtures={fixturesQuery.data}
          resolved={resolved}
        />
      )}
    </>
  );
}

// Keyed by resolved day above, so the in-memory side selection resets
// exactly when the day changes. There is no routing: the toggle below is
// plain component state, defaulting to live, earlier kickoff, then D1.
function GamedayDay({
  fixtures,
  resolved,
}: {
  fixtures: ClubFixture[];
  resolved: ResolvedGameday;
}) {
  const calendarQuery = useCalendarSourceItems();

  const [selected, setSelected] = useState<number | null>(null);
  const fallback = defaultSideIndex(resolved.matches);
  const activeIndex =
    selected !== null && selected < resolved.matches.length
      ? selected
      : fallback;
  const match: SideMatch | undefined = resolved.matches[activeIndex];

  const clubFixture = match
    ? fixtures.find((fixture) => fixture.id === match.fixture.id)
    : undefined;
  const centreQuery = useMatch(
    match?.fixture.id,
    clubFixture
      ? {
          id: clubFixture.compId,
          season: clubFixture.season,
          fixture: clubFixture.id,
          sourceType: clubFixture.sourceType ?? '2',
        }
      : undefined
  );

  const status = clubFixture
    ? matchStatus({ status: clubFixture.status, isLive: clubFixture.isLive })
    : null;

  const calendarMatch = match
    ? matchCalendarItem(match, calendarQuery.data ?? [])
    : undefined;
  const location = resolveMatchLocation(
    calendarMatch?.location,
    clubFixture?.venue
  );
  // The feed stamps placeholder times, so the score card shows the
  // calendar item's real start when matched. Date-only items carry no
  // time and fall back to the feed.
  const kickoff = calendarMatch?.start?.includes('T')
    ? calendarMatch.start
    : undefined;

  if (!match) {
    return (
      <Centered>
        <Typography variant="body2" color="text.secondary">
          No match selected.
        </Typography>
      </Centered>
    );
  }

  // No page header: the score card below already carries the matchup,
  // date, and kickoff time. This row holds just the status and, on
  // two-match days, the side toggle.
  return (
    <>
      <Box
        sx={{
          ...PAGE_WIDTH,
          pt: { xs: 2, md: 4 },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        {status && status !== 'Scheduled' && (
          <Chip
            label={status}
            size="small"
            color={status === 'Live' ? 'error' : 'default'}
          />
        )}
        {resolved.matches.length > 1 && (
          <Tabs
            value={activeIndex}
            onChange={(_event, value) => setSelected(value)}
            aria-label="Choose side"
          >
            {resolved.matches.map((sideMatch, index) => (
              <Tab
                key={sideMatch.side.label}
                label={sideMatch.side.label}
                value={index}
              />
            ))}
          </Tabs>
        )}
      </Box>
      {centreQuery.isPending && (
        <Centered>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Loading match details…
          </Typography>
        </Centered>
      )}
      {centreQuery.isError && (
        <Centered>
          <Typography variant="body2" color="text.secondary">
            Match details failed to load.
          </Typography>
        </Centered>
      )}
      {centreQuery.data && (
        <MatchCentre
          data={centreQuery.data}
          location={location}
          kickoff={kickoff}
        />
      )}
    </>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
        minHeight: '60vh',
      }}
    >
      {children}
    </Box>
  );
}
