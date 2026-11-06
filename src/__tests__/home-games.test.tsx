import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ClubFixture } from '@/api/scores';

const mocks = vi.hoisted(() => ({
  calendar: { data: [], isPending: false } as { data: unknown[]; isPending: boolean },
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
vi.mock('@/api/calendar', () => ({
  useCalendarSourceItems: () => mocks.calendar,
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

const render = () => renderToStaticMarkup(<HomeGames />);

describe('HomeGames', () => {
  beforeEach(() => {
    mocks.query = { data: undefined, isPending: true, isError: false };
    mocks.calendar = { data: [], isPending: false };
  });

  it('renders the next game card, linked to Gameday, once the window has passed', () => {
    mocks.query = { data: [fx('a', -5), fx('b', 6)], isPending: false, isError: false };
    const html = render();
    expect(html).toContain('Washington MD1');
    expect(html).not.toContain('Next game');
    expect(html).not.toContain('data-testid="ticker"');
    expect(html).toContain('href="/gameday"');
  });

  it('renders the card while the calendar loads, holding back the time of day', () => {
    mocks.query = { data: [fx('b', 6)], isPending: false, isError: false };
    mocks.calendar = { data: [], isPending: true };
    const loading = render();
    expect(loading).toContain('Washington MD1');
    expect(loading).toContain('MAC Men D1');
    mocks.calendar = { data: [], isPending: false };
    const loaded = render();
    expect(loaded.length).toBeGreaterThan(loading.length);
    expect(loaded).toMatch(/\d:\d\d/);
    expect(loading).not.toMatch(/\d:\d\d/);
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
