import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const mocks = vi.hoisted(() => ({
  query: {} as Record<string, string>,
  saved: null as { season: string; rows: unknown[]; gaps: unknown[] } | null,
}));

const fixture = (home: string, away: string) => ({
  compName: 'MAC Men D1',
  homeTeam: { name: home, score: '' },
  awayTeam: { name: away, score: '' },
});

vi.mock('next/router', () => ({
  useRouter: () => ({ query: mocks.query, replace: vi.fn() }),
}));

vi.mock('@/api/capital', () => ({ loadCurrentSeasonFixtures: vi.fn() }));

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => ({
    data:
      queryKey[0] === 'eligibility-fixtures'
        ? [fixture('Rocky Gorge MD1', 'Baltimore Chesapeake MD1')]
        : mocks.saved,
    isPending: false,
    isError: false,
    isSuccess: true,
  }),
}));

vi.mock('@zmnatz/usa-club-rugby-components', () => ({
  ClubEligibilityReport: ({ club }: { club: { key: string } }) => <div data-report={club.key} />,
  MatchParticipationReport: () => <div data-csv="" />,
}));

import EligibilityPage from '../../pages/utils/eligibility';

const render = () => renderToStaticMarkup(<EligibilityPage />);

describe('eligibility page', () => {
  beforeEach(() => {
    mocks.query = {};
    mocks.saved = { season: '2026/2027', rows: [], gaps: [] };
  });

  it("shows this site's own club by default", () => {
    expect(render()).toContain('data-report="rocky-gorge"');
  });

  it('shows the club named in the URL', () => {
    mocks.query = { club: 'baltimore-chesapeake' };
    expect(render()).toContain('data-report="baltimore-chesapeake"');
  });

  it('falls back to the default for a club it does not know', () => {
    mocks.query = { club: 'no-such-club' };
    expect(render()).toContain('data-report="rocky-gorge"');
  });

  it('reports a missing match record instead of showing a report', () => {
    mocks.saved = null;
    const html = render();
    expect(html).toContain('Could not load the match record');
    expect(html).not.toContain('data-report');
  });

  it('keeps the CSV report mounted but hidden, so a pasted report survives switching source', () => {
    expect(render()).toContain('<div hidden=""><div data-csv=""></div></div>');
  });
});
