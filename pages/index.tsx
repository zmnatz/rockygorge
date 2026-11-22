import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import home from '@content/home.yml';
import links from '@content/links.yml';
import forms from '@content/forms.yml';
import StoreItems from '@content/store.yml';
import events from '@content/events.yml';
import { Fragment } from 'react';
import { Grid, Typography } from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { ProductCard } from '@/components/ProductCard';
import { CalendarCard } from '@/components/CalendarCard';
import { HomeGames } from '@/components/Scores/HomeGames';
import type { Score } from '@/components/Scores/types';
import type { CalendarEvent } from '@/components/CalendarCard/types';
import { crestSrc } from '@/utils/crest';
import { readPublishedJson } from '@/utils/publishedData';
import {
  CALENDAR_SHORT_MAX_AGE_SECONDS,
  fetchCalendarItems,
  setCalendarCacheHeader,
} from '@/utils/calendarServer';
import { groupCalendarEvents } from '@/utils/calendar';
import calendarInfo from '@content/calendar.yml';
import type { CalendarSourceItem } from '@/components/CalendarCard/types';
import { markdownToReact } from '@/utils/markdown';
import matchesConfig from '@config/matches.yml';
import { HOME_RESULT_COUNT, homePageScores } from '@/utils/gameday';
import { showOnHome, toSectionCard } from '@/utils/sections';

// Ticker size (see Scores.tsx MAX_GAMES).

interface HomeProps {
  initialScores: Score[];
  // The calendar, read on the server: every item for the next-game kickoff, and the card's
  // lists by filter (null when the calendar couldn't be read).
  calendarItems: CalendarSourceItem[];
  calendarEvents: Record<string, CalendarEvent[]> | null;
  builtAt: string;
}

// The nightly scores snapshot (scripts/generate-scores-index.ts) and the calendar, rendered
// on request and cached by the CDN for 5 minutes with no stale copy served
// (src/utils/calendarServer.ts), so the ticker's results, the next game and the calendar
// follow the clock. A missing file (e.g. local dev before first generate) falls back to
// live CMS data client-side.
export const getServerSideProps: GetServerSideProps<HomeProps> = async ({ res }) => {
  const [scores, calendar] = await Promise.all([
    readPublishedJson<Score[]>('scores.json'),
    fetchCalendarItems(),
  ]);
  setCalendarCacheHeader(res, calendar, CALENDAR_SHORT_MAX_AGE_SECONDS);
  // The snapshot spans the season; the page needs only the ticker's results and the next
  // game, so inline just those.
  const initialScores = Array.isArray(scores)
    ? homePageScores(scores, HOME_RESULT_COUNT, matchesConfig.sides.length)
    : [];
  return {
    props: {
      initialScores,
      calendarItems: calendar ?? [],
      calendarEvents: calendar ? groupCalendarEvents(calendar, calendarInfo.filters) : null,
      builtAt: new Date().toISOString(),
    },
  };
};

export const itemsBySource = {
  store: showOnHome(StoreItems),
  events: showOnHome(events),
  links: showOnHome([...links, ...forms]),
};

function HomeSections() {
  return (
    <Grid container spacing={2} sx={{ justifyContent: 'center' }}>
      {home.sections.map((section) => (
        <Fragment key={section.source}>
          {section.title && (
            <Grid size={{ xs: 12 }}>
              <Typography variant="h5">{section.title}</Typography>
            </Grid>
          )}
          {itemsBySource[section.source].map((item) => {
            const card = toSectionCard(item, section.card);
            return (
              <ProductCard key={card.key} title={card.title} href={card.href}>
                {markdownToReact(card.summary)}
              </ProductCard>
            );
          })}
        </Fragment>
      ))}
    </Grid>
  );
}

export default function Home({ initialScores, calendarItems, calendarEvents, builtAt }: HomeProps) {
  const crests = [
    ...new Set(
      initialScores
        .flatMap((score) => [score.homeTeam.crest, score.awayTeam.crest])
        .filter(Boolean)
        .map((crest) => crestSrc(crest))
    ),
  ];
  return (
    <Grid container spacing={2} sx={{ py: 2, width: '100%', maxWidth: 1200, mx: 'auto' }}>
      <Typography component="h1" variant="h4" sx={visuallyHidden}>
        Rocky Gorge Rugby
      </Typography>
      <Head>
        {crests.map((crest) => (
          <link key={crest} rel="preload" as="image" href={crest} />
        ))}
      </Head>
      <Grid size={{ xs: 12 }}>
        <HomeGames initialScores={initialScores} calendarItems={calendarItems} builtAt={builtAt} />
      </Grid>

      <Grid size={{ xs: 12 }} sx={{ textAlign: 'center' }}>
        {markdownToReact(home.hero.markdown)}
      </Grid>

      <Grid container spacing={2} sx={{ width: '100%' }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <HomeSections />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <CalendarCard calendars={home.calendars} events={calendarEvents} />
        </Grid>
      </Grid>
    </Grid>
  );
}
