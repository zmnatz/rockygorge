import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const mocks = vi.hoisted(() => ({
  query: {} as Record<string, string>,
  saved: null as { season: string; rows: unknown[]; gaps: unknown[] } | null,
  reportProps: {} as Record<string, unknown>,
  csvProps: {} as Record<string, unknown>,
  ensured: [] as unknown[],
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
  useQueryClient: () => ({
    ensureQueryData: (options: { queryKey: string[] }) => {
      mocks.ensured.push(options.queryKey);
      return Promise.resolve([]);
    },
  }),
}));

vi.mock('@zmnatz/usa-club-rugby-components', () => ({
  ClubEligibilityReport: (props: { club: { key: string } }) => {
    mocks.reportProps = props;
    return <div data-report={props.club.key} />;
  },
  MatchParticipationReport: (props: Record<string, unknown>) => {
    mocks.csvProps = props;
    return <div data-csv="" />;
  },
}));

import EligibilityPage from '../../pages/utils/eligibility';

const render = () => renderToStaticMarkup(<EligibilityPage />);

describe('eligibility page', () => {
  beforeEach(() => {
    mocks.query = {};
    mocks.saved = { season: '2026/2027', rows: [], gaps: [] };
    mocks.ensured = [];
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

  it("links each player's name to their page on this site", () => {
    render();
    const playerHref = mocks.reportProps.playerHref as (id: string) => string;
    expect(playerHref('abc 1')).toBe('/player?id=abc%201');
  });

  it('gives the CSV report the fixture list from the same query as the match record', async () => {
    render();
    await (mocks.csvProps.loadFixtures as () => Promise<unknown>)();
    expect(mocks.ensured).toEqual([['eligibility-fixtures']]);
  });

  it('keeps the CSV report mounted but hidden, so a pasted report survives switching source', () => {
    expect(render()).toContain('<div hidden=""><div data-csv=""></div></div>');
  });
});
