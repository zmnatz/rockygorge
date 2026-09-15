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
import { ProductCard } from '@/components/ProductCard';
import { CalendarCard } from '@/components/CalendarCard';
import { Scores } from '@/components/Scores';
import type { Score } from '@/components/Scores/types';
import { markdownToReact } from '@/utils/markdown';
import { showOnHome, toSectionCard } from '@/utils/sections';

interface HomeProps {
  initialScores: Score[];
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
      initialScores = json as Score[];
    }
  } catch {
    // Fall back to client-side live fetch
  }
  return { props: { initialScores } };
};

export const itemsBySource = {
  store: showOnHome(StoreItems),
  events: showOnHome(events),
  links: showOnHome([...links, ...forms]),
};

export default function Home({ initialScores }: HomeProps) {
  const crests = [
    ...new Set(
      initialScores.flatMap((score) => [score.homeTeam.crest, score.awayTeam.crest]).filter(Boolean)
    ),
  ];
  return (
    <Grid container spacing={2} sx={{ py: 2, width: '100%', maxWidth: 1200, mx: 'auto' }}>
      <Head>
        {crests.map((crest) => (
          <link key={crest} rel="preload" as="image" href={crest} />
        ))}
      </Head>
      <Scores initialScores={initialScores} />

      <Grid size={{ xs: 12 }} sx={{ textAlign: 'center' }}>
        {markdownToReact(home.hero.markdown)}
      </Grid>

      <Grid container spacing={2} sx={{ width: '100%' }}>
        <Grid size={{ xs: 12, md: 6 }}>
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
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <CalendarCard calendars={home.calendars} />
        </Grid>
      </Grid>
    </Grid>
  );
}
