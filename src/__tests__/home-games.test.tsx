import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ClubFixture } from '@/api/scores';
import type { CalendarSourceItem } from '@/components/CalendarCard/types';

const mocks = vi.hoisted(() => ({
  calendar: [] as CalendarSourceItem[],
  seed: undefined as ClubFixture[] | undefined,
  query: { data: undefined, isPending: true, isError: false } as {
    data: ClubFixture[] | undefined;
    isPending: boolean;
    isError: boolean;
  },
}));

vi.mock('@/api/scores', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/scores')>()),
  useGamedayFixtures: (seed?: ClubFixture[]) => {
    mocks.seed = seed;
    return mocks.query;
  },
}));

vi.mock('@/utils/nextLink', () => ({
  NextLinkComposed: ({ href, ...rest }: { href: string }) => <a href={href} {...rest} />,
}));
vi.mock('@/components/Scores/Scores', () => ({
  Scores: () => <div data-testid="ticker" />,
}));

import { HomeGames } from '@/components/Scores/HomeGames';

function at(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

function fx(id: string, days: number): ClubFixture {
  return {
    id,
    compId: 'c',
    compName: 'MAC Men D1',
    dateTime: at(days),
    season: '2026',
    status: 'Fixture',
    venue: 'TBA',
    sourceType: '2',
    isLive: false,
    homeTeam: { name: 'Rocky Gorge MD1' },
    awayTeam: { name: 'Washington MD1' },
  };
}

const render = () => renderToStaticMarkup(<HomeGames calendarItems={mocks.calendar} />);

describe('HomeGames', () => {
  beforeEach(() => {
    mocks.query = { data: undefined, isPending: true, isError: false };
    mocks.calendar = [];
  });

  it('renders the next game card, linked to Gameday, once the window has passed', () => {
    mocks.query = { data: [fx('a', -5), fx('b', 6)], isPending: false, isError: false };
    const html = render();
    expect(html).toContain('Washington MD1');
    expect(html).toContain('Next game');
    expect(html).not.toContain('data-testid="ticker"');
    expect(html).toContain('href="/gameday"');
  });

  it('renders the card without a time of day until the calendar has the kickoff', () => {
    mocks.query = { data: [fx('b', 6)], isPending: false, isError: false };
    const without = render();
    expect(without).toContain('Washington MD1');
    expect(without).toContain('MAC Men D1');
    expect(without).not.toMatch(/\d:\d\d/);
    const start = at(6).replace('T12:', 'T15:');
    mocks.calendar = [{ summary: 'MD1 vs Washington', start, end: start, location: '', htmlLink: '' }];
    expect(render()).toMatch(/\d:\d\d/);
  });

  it('never falls back to the feed time when the calendar has no kickoff', () => {
    mocks.query = { data: [fx('b', 6)], isPending: false, isError: false };
    mocks.calendar = [];
    expect(render()).not.toMatch(/\d:\d\d/);
  });

  it('puts the venue in the header as an icon button plus text, once known', () => {
    mocks.query = { data: [fx('b', 6)], isPending: false, isError: false };
    const start = at(6).replace('T12:', 'T15:');
    mocks.calendar = [
      { summary: 'MD1 vs Washington', start, end: start, location: 'Field 3, Rockville', htmlLink: '' },
    ];
    const html = render();
    expect(html).toContain('aria-label="Map: Field 3, Rockville"');
    expect(html).toContain('Field 3, Rockville</span>');
    mocks.calendar = [];
    expect(render()).not.toContain('aria-label="Map:');
  });

  it('seeds the live fixtures query from the snapshot scores', () => {
    mocks.query = { data: [fx('b', 6)], isPending: false, isError: false };
    const upcoming = {
      ...fx('b', 6),
      homeTeam: { name: 'Rocky Gorge MD1', score: '', crest: '' },
      awayTeam: { name: 'Washington MD1', score: '', crest: '' },
    };
    renderToStaticMarkup(<HomeGames initialScores={[upcoming as never]} />);
    expect(mocks.seed?.map((fixture) => fixture.id)).toEqual(['b']);
  });

  it('judges today against the snapshot build time on first render', () => {
    const fixture = fx('b', 0);
    mocks.query = { data: [fixture], isPending: false, isError: false };
    // Built long before the fixture's day: it is still "next" then.
    const builtAt = new Date(Date.now() - 10 * 86400000).toISOString();
    expect(renderToStaticMarkup(<HomeGames builtAt={builtAt} />)).toContain('Washington MD1');
    expect(render()).toBe('<div data-testid="ticker"></div>');
  });

  it('renders the fixture crests', () => {
    const fixture = fx('b', 6);
    fixture.awayTeam = { name: 'Washington MD1', crest: '/crests/wash.png' };
    mocks.query = { data: [fixture], isPending: false, isError: false };
    expect(render()).toContain('wash.png');
  });

  it.each([
    ['while loading', { data: undefined, isPending: true, isError: false }],
    ['on error', { data: undefined, isPending: false, isError: true }],
    ['with no fixtures', { data: [], isPending: false, isError: false }],
  ])('shows the results ticker %s', (_label, query) => {
    mocks.query = query as typeof mocks.query;
    expect(render()).toBe('<div data-testid="ticker"></div>');
  });

  it.each([
    ['a game today', 0],
    ['a recent result', -1],
    ['a result two days ago', -2],
  ])('shows the results ticker, not the card, for %s', (_label, days) => {
    mocks.query = { data: [fx('a', days), fx('b', 6)], isPending: false, isError: false };
    expect(render()).toBe('<div data-testid="ticker"></div>');
  });
});
