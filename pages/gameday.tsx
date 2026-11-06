import fs from 'node:fs';
import path from 'node:path';
import { useEffect, useMemo, useState } from 'react';
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import CircularProgress from '@mui/material/CircularProgress';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { visuallyHidden } from '@mui/utils';
import { useCalendarSourceItems } from '@/api/calendar';
import { scoreToClubFixture, useGamedayFixtures, type ClubFixture } from '@/api/scores';
import { MatchCentre } from '@/components/MatchCentre';
import { ScoreCard } from '@/components/Scores/ScoreCard';
import type { Score } from '@/components/Scores/types';
import { useMatch } from '@/components/Scores/useMatch';
import matchesConfig from '@config/matches.yml';
import type { ResolvedGameday, SideMatch } from '@/types/gameday';
import {
  assignMatchWindows,
  defaultSideIndex,
  gamedaySeedScores,
  matchStatus,
  resolveGameday,
  resolveMatchLocation,
} from '@/utils/gameday';
import { formatStartDate } from '@/utils/calendar';

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

interface GamedayPageProps {
  // Build-time snapshot of the club's fixtures around the resolved Gameday.
  // Renders the page's scaffold (teams, crests, date) with the static HTML;
  // the live reads only fill in kickoff, venue, lineups and events.
  initialScores: Score[];
  builtAt: string;
}

// Missing snapshot (e.g. local dev before first generate) leaves the seed
// empty and the page falls back to the live fixtures read.
export const getStaticProps: GetStaticProps<GamedayPageProps> = async () => {
  const builtAt = new Date();
  let initialScores: Score[] = [];
  try {
    const raw = fs.readFileSync(
      path.join(process.cwd(), 'public', 'data', 'scores.json'),
      'utf-8'
    );
    const json = JSON.parse(raw);
    if (Array.isArray(json)) {
      initialScores = gamedaySeedScores(json as Score[], sides, builtAt);
    }
  } catch {
    // Fall back to the live read.
  }
  return { props: { initialScores, builtAt: builtAt.toISOString() } };
};

export default function GamedayPage({ initialScores = [], builtAt }: Partial<GamedayPageProps>) {
  const seed = useMemo(
    () =>
      initialScores
        .map(scoreToClubFixture)
        .filter((fixture): fixture is ClubFixture => fixture !== null),
    [initialScores]
  );
  const fixturesQuery = useGamedayFixtures(seed.length > 0 ? seed : undefined);

  // The first render judges "today" against build time so the client
  // hydrates to exactly the static markup; the real clock takes over after.
  const [now, setNow] = useState(() => (builtAt ? new Date(builtAt) : new Date()));
  useEffect(() => {
    setNow(new Date());
  }, []);

  const resolved = useMemo(
    () => resolveGameday(fixturesQuery.data ?? [], sides, now),
    [fixturesQuery.data, now]
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
          snapshot={initialScores}
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
  snapshot,
}: {
  fixtures: ClubFixture[];
  resolved: ResolvedGameday;
  snapshot: Score[];
}) {
  const calendarQuery = useCalendarSourceItems();

  const [selected, setSelected] = useState<number | null>(null);
  const fallback = defaultSideIndex(resolved.matches);
  const activeIndex =
    selected !== null && selected < resolved.matches.length
      ? selected
      : fallback;
  const assignments = useMemo(
    () => assignMatchWindows(resolved.matches, calendarQuery.data ?? []),
    [resolved.matches, calendarQuery.data]
  );
  const assignment = assignments[activeIndex];
  const match: SideMatch | undefined = assignment?.match;

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

  const location = resolveMatchLocation(
    assignment?.item?.location,
    clubFixture?.venue
  );
  const kickoff = assignment?.kickoff;

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
        {assignments.length > 1 && (
          <Tabs
            value={activeIndex}
            onChange={(_event, value) => setSelected(value)}
            aria-label="Choose side"
          >
            {assignments.map(({ match: sideMatch, kickoff: sideKickoff }, index) => (
              <Tab
                key={sideMatch.side.label}
                value={index}
                label={
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      lineHeight: 1.4,
                    }}
                  >
                    <span>{sideMatch.side.label}</span>
                    {sideKickoff && (
                      <Typography
                        variant="caption"
                        component="span"
                        color="text.secondary"
                      >
                        {formatStartDate(sideKickoff)}
                      </Typography>
                    )}
                  </Box>
                }
              />
            ))}
          </Tabs>
        )}
      </Box>
      {centreQuery.isPending && (
        <Scaffold
          match={match}
          clubFixture={clubFixture}
          snapshot={snapshot.find((score) => score.id === match.fixture.id)}
          kickoff={kickoff}
          location={location}
        />
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

// Basic match info from the snapshot while the live Match Centre loads: the
// same score card the Match Centre opens with, so the page is whole on
// first paint. A played fixture keeps its snapshot score and crests.
function Scaffold({
  match,
  clubFixture,
  snapshot,
  kickoff,
  location,
}: {
  match: SideMatch;
  clubFixture: ClubFixture | undefined;
  snapshot: Score | undefined;
  kickoff: string | undefined;
  location: string | undefined;
}) {
  const score: Score = snapshot ?? {
    id: match.fixture.id,
    dateTime: match.fixture.dateTime,
    compName: clubFixture?.compName ?? match.side.compName,
    homeTeam: {
      id: '',
      teamId: '',
      name: match.fixture.homeTeam.name,
      score: '',
      crest: clubFixture?.homeTeam.crest ?? '',
    },
    awayTeam: {
      id: '',
      teamId: '',
      name: match.fixture.awayTeam.name,
      score: '',
      crest: clubFixture?.awayTeam.crest ?? '',
    },
  };
  // Mirrors the Match Centre's grid (score card, two roster panels, events
  // column) so the live view replaces it in place with no layout jump.
  return (
    <Box
      sx={{
        py: { xs: 2, md: 4 },
        px: { xs: 2, md: 3 },
        maxWidth: { xs: '100%', lg: 1400, xl: 1800 },
        mx: 'auto',
      }}
      data-testid="gameday-scaffold"
      aria-busy="true"
    >
      <Typography role="status" sx={visuallyHidden}>
        Loading lineups and events
      </Typography>
      <Grid container spacing={2} sx={{ justifyContent: 'center' }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Box sx={{ mb: 2, width: '100%' }}>
            <ScoreCard
              score={score}
              large
              kickoff={kickoff}
              // The feed time is a placeholder: show the day alone until
              // the calendar supplies the real kickoff.
              hideTime={!kickoff}
              location={location}
            />
          </Box>
          <Grid container spacing={2} sx={{ justifyContent: 'center' }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <PanelSkeleton rows={23} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <PanelSkeleton rows={23} />
            </Grid>
          </Grid>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <PanelSkeleton rows={8} centredTitle />
        </Grid>
      </Grid>
    </Box>
  );
}

// A roster or events panel's outline: a title, a divider, then rows the
// height of the real lines (body2 plus its bottom margin).
function PanelSkeleton({ rows, centredTitle }: { rows: number; centredTitle?: boolean }) {
  return (
    <Paper sx={{ p: 2 }}>
      <Skeleton
        variant="text"
        width="45%"
        sx={{ fontSize: '1.25rem', mx: centredTitle ? 'auto' : 0 }}
      />
      <Divider sx={{ my: 1.5 }} />
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows have no identity
          key={index}
          variant="text"
          sx={{ fontSize: '0.875rem', mb: 0.5, width: index % 3 === 0 ? '90%' : '100%' }}
        />
      ))}
    </Paper>
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
