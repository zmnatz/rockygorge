import fs from 'node:fs';
import path from 'node:path';
import type { GetStaticProps } from 'next';
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
import { crestSrc } from '@/utils/crest';
import { markdownToReact } from '@/utils/markdown';
import matchesConfig from '@config/matches.yml';
import { HOME_RESULT_COUNT, homePageScores } from '@/utils/gameday';
import { showOnHome, toSectionCard } from '@/utils/sections';

// Ticker size (see Scores.tsx MAX_GAMES).

interface HomeProps {
  initialScores: Score[];
  builtAt: string;
}

// Snapshot baked at build time (scripts/generate-scores-index.ts runs just
// before `next build`). Missing file (e.g. local dev before first generate)
// falls back to live CMS data client-side.
export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  let initialScores: Score[] = [];
  try {
    const raw = fs.readFileSync(
      path.join(process.cwd(), 'public', 'data', 'scores.json'),
      'utf-8'
    );
    const json = JSON.parse(raw);
    if (Array.isArray(json)) {
      // The snapshot spans the season; the page needs only the ticker's
      // results and the next game, so inline just those.
      initialScores = homePageScores(json as Score[], HOME_RESULT_COUNT, matchesConfig.sides.length);
    }
  } catch {
    // Fall back to client-side live fetch
  }
  return { props: { initialScores, builtAt: new Date().toISOString() } };
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

export default function Home({ initialScores, builtAt }: HomeProps) {
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
        <HomeGames initialScores={initialScores} builtAt={builtAt} />
      </Grid>

      <Grid size={{ xs: 12 }} sx={{ textAlign: 'center' }}>
        {markdownToReact(home.hero.markdown)}
      </Grid>

      <Grid container spacing={2} sx={{ width: '100%' }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <HomeSections />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <CalendarCard calendars={home.calendars} />
        </Grid>
      </Grid>
    </Grid>
  );
}
