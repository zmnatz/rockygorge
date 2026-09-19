import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ClubFixture } from '@/api/scores';
import type { CalendarSourceItem } from '@/components/CalendarCard/types';

const mocks = vi.hoisted(() => ({
  fixtures: [] as ClubFixture[],
  calendar: [] as CalendarSourceItem[],
  centreById: {} as Record<string, { home: string; away: string }>,
}));

vi.mock('next/head', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/api/scores', () => ({
  useGamedayFixtures: () => ({
    data: mocks.fixtures,
    isPending: false,
    isError: false,
  }),
}));

vi.mock('@/api/calendar', () => ({
  useCalendarSourceItems: () => ({ data: mocks.calendar }),
}));

vi.mock('@/components/Scores/useMatch', () => ({
  useMatch: (matchId: string | undefined) => {
    const centre = matchId ? mocks.centreById[matchId] : undefined;
    return {
      data: centre
        ? {
            getFixtureItem: {
              id: matchId,
              homeTeam: { name: centre.home },
              awayTeam: { name: centre.away },
            },
          }
        : undefined,
      isPending: !centre,
      isError: false,
    };
  },
}));

vi.mock('@/components/MatchCentre', () => ({
  MatchCentre: ({
    data,
    location,
  }: {
    data: {
      getFixtureItem: { homeTeam: { name: string }; awayTeam: { name: string } };
    };
    location?: string;
  }) => (
    <div
      data-centre={`${data.getFixtureItem.homeTeam.name} vs ${data.getFixtureItem.awayTeam.name}`}
      data-location={location ?? ''}
    />
  ),
}));

import GamedayPage from '../../pages/gameday';

function atDaysOffset(days: number, hour = 12): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function clubFixture(
  id: string,
  home: string,
  away: string,
  dateTime: string,
  overrides: Partial<ClubFixture> = {}
): ClubFixture {
  return {
    id,
    compId: 'comp',
    compName: 'Test Comp',
    dateTime,
    season: '2026/2027',
    status: 'Fixture',
    venue: 'Test Venue',
    sourceType: '2',
    isLive: false,
    homeTeam: { name: home },
    awayTeam: { name: away },
    ...overrides,
  };
}

function calendarItem(summary: string, start: string): CalendarSourceItem {
  return {
    summary,
    location: 'Supplee Lane',
    htmlLink: 'https://example.test/calendar',
    start,
    end: start,
  };
}

function render(): string {
  return renderToStaticMarkup(<GamedayPage />);
}

beforeEach(() => {
  mocks.fixtures = [];
  mocks.calendar = [];
  mocks.centreById = {};
});

describe('GamedayPage', () => {
  it('toggles between both Sides and defaults to the live Match', () => {
    const d1At = atDaysOffset(0, 13);
    const d3At = atDaysOffset(0, 15);
    mocks.fixtures = [
      clubFixture('d1', 'Rocky Gorge MD1', 'Washington MD1', d1At, {
        isLive: true,
        status: 'Live',
      }),
      clubFixture('d3', 'Rocky Gorge MD3', 'Washington MD3', d3At),
    ];
    mocks.calendar = [calendarItem('RG vs Washington', d1At)];
    mocks.centreById = {
      d1: { home: 'Rocky Gorge MD1', away: 'Washington MD1' },
      d3: { home: 'Rocky Gorge MD3', away: 'Washington MD3' },
    };

    const html = render();

    expect(html).toContain('<title>Gameday | Rocky Gorge Rugby</title>');
    expect(html).toContain('aria-label="Choose side"');
    expect(html).toContain('>D1<');
    expect(html).toContain('>D3<');
    expect(html).toContain('>Live<');
    expect(html).toContain('data-location="Supplee Lane"');
    expect(html).not.toContain('Kickoff');
    expect(html).toContain('data-centre="Rocky Gorge MD1 vs Washington MD1"');
    expect(html).not.toContain('Rocky Gorge MD3 vs Washington MD3');
  });

  it('hides the toggle on single-Match days', () => {
    const kickoff = atDaysOffset(0, 13);
    mocks.fixtures = [clubFixture('d1', 'Rocky Gorge MD1', 'Washington MD1', kickoff)];
    mocks.centreById = { d1: { home: 'Rocky Gorge MD1', away: 'Washington MD1' } };

    const html = render();

    expect(html).not.toContain('aria-label="Choose side"');
    expect(html).not.toContain('>Scheduled<');
    expect(html).toContain('data-location="Test Venue"');
    expect(html).toContain('data-centre="Rocky Gorge MD1 vs Washington MD1"');
  });

  it('defaults to the earlier kickoff without a live Match', () => {
    mocks.fixtures = [
      clubFixture('d1', 'Rocky Gorge MD1', 'Washington MD1', atDaysOffset(0, 15)),
      clubFixture('d3', 'Rocky Gorge MD3', 'Washington MD3', atDaysOffset(0, 13)),
    ];
    mocks.centreById = {
      d1: { home: 'Rocky Gorge MD1', away: 'Washington MD1' },
      d3: { home: 'Rocky Gorge MD3', away: 'Washington MD3' },
    };

    const html = render();

    expect(html).toContain('aria-label="Choose side"');
    expect(html).toContain('data-centre="Rocky Gorge MD3 vs Washington MD3"');
  });

  it('shows the empty state with no Matches', () => {
    const html = render();

    expect(html).toContain('No matches scheduled');
    expect(html).not.toContain('aria-label="Choose side"');
  });
});
