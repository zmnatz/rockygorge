import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ClubFixture } from '@/api/scores';

const mocks = vi.hoisted(() => ({
  calendar: { data: [], isPending: false } as { data: unknown[]; isPending: boolean },
  query: { data: undefined, isPending: true, isError: false } as {
    data: ClubFixture[] | undefined;
    isPending: boolean;
    isError: boolean;
  },
}));

vi.mock('@/api/scores', () => ({ useGamedayFixtures: () => mocks.query }));
vi.mock('@/api/calendar', () => ({
  useCalendarSourceItems: () => mocks.calendar,
}));
vi.mock('@/utils/nextLink', () => ({
  NextLinkComposed: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import { NextGameCard } from '@/components/Scores/NextGameCard';

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

const render = () => renderToStaticMarkup(<NextGameCard />);

describe('NextGameCard', () => {
  beforeEach(() => {
    mocks.query = { data: undefined, isPending: true, isError: false };
    mocks.calendar = { data: [], isPending: false };
  });

  it('renders the next game with a Gameday link once the window has passed', () => {
    mocks.query = { data: [fx('a', -5), fx('b', 6)], isPending: false, isError: false };
    const html = render();
    expect(html).toContain('Next game');
    expect(html).toContain('href="/gameday"');
    expect(html).toContain('Washington MD1');
  });

  it('waits for the calendar so the kickoff never flashes a placeholder', () => {
    mocks.query = { data: [fx('b', 6)], isPending: false, isError: false };
    mocks.calendar = { data: [], isPending: true };
    expect(render()).toBe('');
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
  ])('renders nothing %s', (_label, query) => {
    mocks.query = query as typeof mocks.query;
    expect(render()).toBe('');
  });

  it.each([
    ['a game today', 0],
    ['a recent result', -1],
    ['a result two days ago', -2],
  ])('renders nothing for %s', (_label, days) => {
    mocks.query = { data: [fx('a', days), fx('b', 6)], isPending: false, isError: false };
    expect(render()).toBe('');
  });
});
