import { describe, expect, it } from 'vitest';
import matchesConfig from '@config/matches.yml';
import type { CalendarSourceItem } from '@/components/CalendarCard/types';
import type { GamedayFixture, GamedaySide } from '@/types/gameday';
import {
  CENTRE_IDLE_POLL_MS,
  FIXTURES_IDLE_POLL_MS,
  LIVE_POLL_MS,
  centrePollInterval,
  defaultSideIndex,
  findSideMatches,
  fixturesPollInterval,
  matchCalendarItem,
  matchStatus,
  resolveGameday,
  resolveMatchLocation,
  toLocalDayKey,
} from '@/utils/gameday';

const sides = matchesConfig.sides as GamedaySide[];

function atDaysOffset(days: number, hour = 12): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function fixture(partial: Partial<GamedayFixture> & { id: string }): GamedayFixture {
  return {
    dateTime: atDaysOffset(0),
    status: 'Fixture',
    isLive: false,
    homeTeam: { name: 'Rocky Gorge MD1' },
    awayTeam: { name: 'Washington MD1' },
    ...partial,
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

describe('matches config', () => {
  it('declares the two Sides in toggle order', () => {
    expect(sides.map((side) => side.label)).toEqual(['D1', 'D3']);
    expect(sides.map((side) => side.teamName)).toEqual([
      'Rocky Gorge MD1',
      'Rocky Gorge MD3',
    ]);
    expect(sides.map((side) => side.compName)).toEqual([
      'MAC Men D1',
      'Capital Men D3',
    ]);
  });
});

describe('matchStatus', () => {
  it('reads live from the flag ahead of the status text', () => {
    expect(matchStatus({ status: 'Fixture', isLive: true })).toBe('Live');
  });

  it('reads scheduled fixtures', () => {
    expect(matchStatus({ status: 'Fixture', isLive: false })).toBe('Scheduled');
  });

  it('reads results and forfeits as final', () => {
    expect(matchStatus({ status: 'Result', isLive: false })).toBe('Final');
    expect(matchStatus({ status: 'Forfeit', isLive: false })).toBe('Final');
  });
});

describe('fixturesPollInterval', () => {
  it.each(['today', 'recap'] as const)('polls briskly for %s days', (kind) => {
    expect(fixturesPollInterval(kind)).toBe(LIVE_POLL_MS);
  });

  it.each(['next', 'none'] as const)('polls calmly for %s days', (kind) => {
    expect(fixturesPollInterval(kind)).toBe(FIXTURES_IDLE_POLL_MS);
  });
});

describe('centrePollInterval', () => {
  const now = new Date('2026-09-19T17:30:00Z');

  it('polls briskly while live', () => {
    expect(
      centrePollInterval(
        { isLive: true, dateTime: '2026-09-19T13:00:00Z' },
        now
      )
    ).toBe(LIVE_POLL_MS);
  });

  it('polls briskly near kickoff either side', () => {
    expect(
      centrePollInterval({ dateTime: '2026-09-19T17:45:00Z' }, now)
    ).toBe(LIVE_POLL_MS);
    expect(
      centrePollInterval({ dateTime: '2026-09-19T17:15:00Z' }, now)
    ).toBe(LIVE_POLL_MS);
  });

  it('polls calmly for settled and distant Matches', () => {
    expect(
      centrePollInterval({ dateTime: '2026-09-19T13:00:00Z' }, now)
    ).toBe(CENTRE_IDLE_POLL_MS);
    expect(
      centrePollInterval({ dateTime: '2026-09-26T17:00:00Z' }, now)
    ).toBe(CENTRE_IDLE_POLL_MS);
    expect(centrePollInterval({ dateTime: 'not-a-date' }, now)).toBe(
      CENTRE_IDLE_POLL_MS
    );
  });
});

describe('resolveMatchLocation', () => {
  it('prefers the calendar location', () => {
    expect(resolveMatchLocation('Supplee Lane', 'Dorey Park')).toBe(
      'Supplee Lane'
    );
  });

  it('trims whitespace', () => {
    expect(resolveMatchLocation('  Supplee Lane  ', undefined)).toBe(
      'Supplee Lane'
    );
  });

  it('falls back to a real feed venue', () => {
    expect(resolveMatchLocation(undefined, 'Dorey Park')).toBe('Dorey Park');
    expect(resolveMatchLocation('', 'Dorey Park')).toBe('Dorey Park');
  });

  it.each(['TBA', 'TBA - Capital Rugby 2', 'tba whatever'])(
    'omits the placeholder venue %s',
    (venue) => {
      expect(resolveMatchLocation(undefined, venue)).toBeUndefined();
    }
  );

  it('returns undefined with nowhere to point at', () => {
    expect(resolveMatchLocation(undefined, undefined)).toBeUndefined();
    expect(resolveMatchLocation('', '  ')).toBeUndefined();
  });
});

describe('toLocalDayKey', () => {
  it('formats a local calendar day', () => {
    expect(toLocalDayKey(new Date(2026, 8, 19, 12))).toBe('2026-09-19');
  });

  it('returns empty for invalid dates', () => {
    expect(toLocalDayKey('not-a-date')).toBe('');
  });
});

describe('findSideMatches', () => {
  it('ignores fixtures involving neither Side', () => {
    const fixtures = [
      fixture({
        id: 'other',
        homeTeam: { name: 'NOVA MD1' },
        awayTeam: { name: 'Washington Irish MD1' },
      }),
    ];
    expect(findSideMatches(fixtures, sides)).toEqual([]);
  });

  it('buckets Gorge fixtures to Sides with home/away and opponent', () => {
    const fixtures = [
      fixture({ id: 'd1-home' }),
      fixture({
        id: 'd3-away',
        homeTeam: { name: 'Schuylkill River MD3' },
        awayTeam: { name: 'Rocky Gorge MD3' },
      }),
    ];
    const matches = findSideMatches(fixtures, sides);
    expect(matches.map((match) => match.side.label)).toEqual(['D1', 'D3']);
    expect(matches[0]).toMatchObject({
      isGorgeHome: true,
      opponent: 'Washington MD1',
    });
    expect(matches[1]).toMatchObject({
      isGorgeHome: false,
      opponent: 'Schuylkill River MD3',
    });
  });
});

describe('resolveGameday', () => {
  it('resolves none when there are no Gorge fixtures', () => {
    expect(resolveGameday([], sides)).toEqual({ kind: 'none', date: '', matches: [] });
  });

  it('resolves today when the club plays today', () => {
    const resolved = resolveGameday([fixture({ id: 'today' })], sides);
    expect(resolved.kind).toBe('today');
    expect(resolved.date).toBe(toLocalDayKey(new Date()));
    expect(resolved.matches.map((match) => match.fixture.id)).toEqual(['today']);
  });

  it.each([-1, -2])('resolves a recap for a Gameday %i days ago', (offset) => {
    const resolved = resolveGameday(
      [fixture({ id: 'past', dateTime: atDaysOffset(offset) })],
      sides
    );
    expect(resolved.kind).toBe('recap');
    expect(resolved.date).toBe(toLocalDayKey(atDaysOffset(offset)));
  });

  it('moves past the window to the next Gameday', () => {
    const future = atDaysOffset(7);
    const resolved = resolveGameday(
      [
        fixture({ id: 'old', dateTime: atDaysOffset(-3) }),
        fixture({ id: 'next', dateTime: future }),
      ],
      sides
    );
    expect(resolved.kind).toBe('next');
    expect(resolved.date).toBe(toLocalDayKey(future));
    expect(resolved.matches.map((match) => match.fixture.id)).toEqual(['next']);
  });

  it('prefers today over recaps and previews', () => {
    const resolved = resolveGameday(
      [
        fixture({ id: 'past', dateTime: atDaysOffset(-1) }),
        fixture({ id: 'today', dateTime: atDaysOffset(0) }),
        fixture({ id: 'future', dateTime: atDaysOffset(7) }),
      ],
      sides
    );
    expect(resolved.kind).toBe('today');
    expect(resolved.matches.map((match) => match.fixture.id)).toEqual(['today']);
  });

  it('resolves a live Match day as today', () => {
    const liveAt = atDaysOffset(-1);
    const resolved = resolveGameday(
      [fixture({ id: 'live', dateTime: liveAt, isLive: true, status: 'Live' })],
      sides
    );
    expect(resolved.kind).toBe('today');
    expect(resolved.date).toBe(toLocalDayKey(liveAt));
  });

  it('orders same-day Matches by Sides config order', () => {
    const resolved = resolveGameday(
      [
        fixture({
          id: 'd3',
          dateTime: atDaysOffset(0, 15),
          homeTeam: { name: 'Rocky Gorge MD3' },
          awayTeam: { name: 'Washington MD3' },
        }),
        fixture({ id: 'd1', dateTime: atDaysOffset(0, 13) }),
      ],
      sides
    );
    expect(resolved.kind).toBe('today');
    expect(resolved.matches.map((match) => match.side.label)).toEqual(['D1', 'D3']);
  });

  it('ignores fixtures with invalid dates', () => {
    expect(
      resolveGameday([fixture({ id: 'bad', dateTime: 'not-a-date' })], sides)
    ).toEqual({ kind: 'none', date: '', matches: [] });
  });
});

describe('defaultSideIndex', () => {
  function sideMatch(id: string, overrides: Partial<GamedayFixture> = {}) {
    return findSideMatches([fixture({ id, ...overrides })], sides)[0];
  }

  it('returns -1 with no Matches', () => {
    expect(defaultSideIndex([])).toBe(-1);
  });

  it('prefers the live Match', () => {
    const matches = [
      sideMatch('early', { dateTime: atDaysOffset(0, 13) }),
      sideMatch('live', { dateTime: atDaysOffset(0, 15), isLive: true }),
    ];
    expect(defaultSideIndex(matches)).toBe(1);
  });

  it('prefers the earlier kickoff', () => {
    const matches = [
      sideMatch('late', { dateTime: atDaysOffset(0, 15) }),
      sideMatch('early', { dateTime: atDaysOffset(0, 13) }),
    ];
    expect(defaultSideIndex(matches)).toBe(1);
  });

  it('falls back to the first Side', () => {
    const matches = [sideMatch('only')];
    expect(defaultSideIndex(matches)).toBe(0);
  });
});

describe('matchCalendarItem', () => {
  const kickoff = atDaysOffset(0, 13);

  function homeMatch() {
    return findSideMatches(
      [fixture({ id: 'home', dateTime: kickoff })],
      sides
    )[0];
  }

  function awayMatch() {
    return findSideMatches(
      [
        fixture({
          id: 'away',
          dateTime: kickoff,
          homeTeam: { name: 'Washington MD3' },
          awayTeam: { name: 'Rocky Gorge MD3' },
        }),
      ],
      sides
    )[0];
  }

  it('matches a home game by opponent despite the division suffix', () => {
    const item = matchCalendarItem(homeMatch(), [
      calendarItem('RG vs Washington', kickoff),
    ]);
    expect(item?.summary).toBe('RG vs Washington');
  });

  it('matches an away game by the @ direction', () => {
    const item = matchCalendarItem(awayMatch(), [
      calendarItem('RG @ Washington', kickoff),
    ]);
    expect(item?.summary).toBe('RG @ Washington');
  });

  it('rejects the wrong direction rather than guessing', () => {
    expect(
      matchCalendarItem(awayMatch(), [calendarItem('RG vs Washington', kickoff)])
    ).toBeUndefined();
    expect(
      matchCalendarItem(homeMatch(), [calendarItem('RG @ Washington', kickoff)])
    ).toBeUndefined();
  });

  it('uses the division tag when both Sides play the same opponent', () => {
    const homeItems = [
      calendarItem('RG D1 vs Washington', kickoff),
      calendarItem('RG D3 vs Washington', kickoff),
    ];
    expect(matchCalendarItem(homeMatch(), homeItems)?.summary).toBe(
      'RG D1 vs Washington'
    );
    const awayItems = [
      calendarItem('RG D1 @ Washington', kickoff),
      calendarItem('RG D3 @ Washington', kickoff),
    ];
    expect(matchCalendarItem(awayMatch(), awayItems)?.summary).toBe(
      'RG D3 @ Washington'
    );
  });

  it('ignores calendar items on other days', () => {
    expect(
      matchCalendarItem(homeMatch(), [
        calendarItem('RG vs Washington', atDaysOffset(7, 13)),
      ])
    ).toBeUndefined();
  });

  it('returns undefined when nothing matches', () => {
    expect(
      matchCalendarItem(homeMatch(), [
        calendarItem('RG vs Schuylkill', kickoff),
      ])
    ).toBeUndefined();
  });
});
