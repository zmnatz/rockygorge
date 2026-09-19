import type { CalendarSourceItem } from '@/components/CalendarCard/types';
import type {
  GamedayFixture,
  GamedayKind,
  GamedaySide,
  ResolvedGameday,
  SideMatch,
} from '@/types/gameday';

// Gamedays are calendar days in the viewer's locale. A past Gameday stays
// resolved while it is at most this many days old: a Saturday Gameday
// shows through end of Monday, then the page flips to the next Gameday.
export const RECENT_DAY_WINDOW = 2;

export function toLocalDayKey(value: string | Date): string {
  const date = value instanceof Date ? value : parseDayInput(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Picks the club's Matches out of the feed and buckets them to Sides by
// team name. Fixtures involving neither Side are ignored.
export function findSideMatches(
  fixtures: GamedayFixture[],
  sides: GamedaySide[]
): SideMatch[] {
  const matches: SideMatch[] = [];
  for (const fixture of fixtures) {
    for (const side of sides) {
      const isGorgeHome = fixture.homeTeam.name === side.teamName;
      const isGorgeAway = fixture.awayTeam.name === side.teamName;
      if (!isGorgeHome && !isGorgeAway) {
        continue;
      }
      matches.push({
        side,
        fixture,
        isGorgeHome,
        opponent: isGorgeHome ? fixture.awayTeam.name : fixture.homeTeam.name,
      });
    }
  }
  return matches;
}

// Resolves which Gameday the page shows: a live Match's day, else today
// when the club plays, else the most recent Gameday within the window,
// else the next future Gameday, else none. Matches within the day follow
// the Sides config order (the toggle order).
export function resolveGameday(
  fixtures: GamedayFixture[],
  sides: GamedaySide[],
  now: Date = new Date()
): ResolvedGameday {
  const matches = findSideMatches(fixtures, sides);
  if (matches.length === 0) {
    return { kind: 'none', date: '', matches: [] };
  }
  const sideOrder = new Map(sides.map((side, index) => [side.teamName, index]));
  const byDay = new Map<string, SideMatch[]>();
  for (const match of matches) {
    const key = toLocalDayKey(match.fixture.dateTime);
    if (!key) {
      continue;
    }
    const list = byDay.get(key) ?? [];
    list.push(match);
    byDay.set(key, list);
  }
  const dayKeys = [...byDay.keys()].sort();
  if (dayKeys.length === 0) {
    return { kind: 'none', date: '', matches: [] };
  }
  const inSideOrder = (dayMatches: SideMatch[]): SideMatch[] =>
    [...dayMatches].sort(
      (a, b) =>
        (sideOrder.get(a.side.teamName) ?? 0) -
        (sideOrder.get(b.side.teamName) ?? 0)
    );

  // A live Match's day wins.
  const liveDay = dayKeys.find((key) =>
    byDay.get(key)?.some((match) => match.fixture.isLive)
  );
  const liveMatches = liveDay ? byDay.get(liveDay) : undefined;
  if (liveDay && liveMatches) {
    return { kind: 'today', date: liveDay, matches: inSideOrder(liveMatches) };
  }

  // Today's Gameday wins over any recap or preview.
  const todayKey = toLocalDayKey(now);
  const todayMatches = byDay.get(todayKey);
  if (todayMatches) {
    return { kind: 'today', date: todayKey, matches: inSideOrder(todayMatches) };
  }

  // Most recent Gameday within the window.
  const pastDays = dayKeys.filter(
    (key) => key < todayKey && dayDifference(todayKey, key) <= RECENT_DAY_WINDOW
  );
  if (pastDays.length > 0) {
    const date = pastDays[pastDays.length - 1];
    const pastMatches = byDay.get(date);
    if (pastMatches) {
      return { kind: 'recap', date, matches: inSideOrder(pastMatches) };
    }
  }

  // Next future Gameday.
  const futureDay = dayKeys.find((key) => key > todayKey);
  const futureMatches = futureDay ? byDay.get(futureDay) : undefined;
  if (futureDay && futureMatches) {
    return { kind: 'next', date: futureDay, matches: inSideOrder(futureMatches) };
  }

  return { kind: 'none', date: '', matches: [] };
}

// Default toggle pick for the day: the live Match, else the earlier
// kickoff, else the first Side in config order. -1 when there is nothing.
export function defaultSideIndex(matches: SideMatch[]): number {
  if (matches.length === 0) {
    return -1;
  }
  const live = matches.findIndex((match) => match.fixture.isLive);
  if (live >= 0) {
    return live;
  }
  let best = 0;
  for (let index = 1; index < matches.length; index += 1) {
    if (
      new Date(matches[index].fixture.dateTime).getTime() <
      new Date(matches[best].fixture.dateTime).getTime()
    ) {
      best = index;
    }
  }
  return best;
}

// Matches a Match to its Match Calendar Item: same local day, summary
// names the opponent, and the home/away direction agrees (`vs` at home,
// `@` away). A division tag in the summary disambiguates when both Sides
// play the same opponent. No confident match returns undefined rather
// than guessing.
export interface MatchWindowAssignment {
  match: SideMatch;
  item: CalendarSourceItem | undefined;
  // Timed kickoff for the score card: the item's start, except on a
  // shared doubleheader block (below). Undefined when there is no
  // confident timed start.
  kickoff: string | undefined;
}

// Assigns every Match of the day to its calendar item. When both Sides
// share one block — the doubleheader day, one 3–4 hour calendar event —
// the block splits in half: club convention is D3 first, D1 halfway
// through. Separate blocks (or a lone Match) keep their own start.
export function assignMatchWindows(
  matches: SideMatch[],
  items: CalendarSourceItem[]
): MatchWindowAssignment[] {
  const itemByMatch = new Map<SideMatch, CalendarSourceItem | undefined>(
    matches.map((match) => [match, matchCalendarItem(match, items)])
  );
  const groups = new Map<CalendarSourceItem, SideMatch[]>();
  for (const match of matches) {
    const item = itemByMatch.get(match);
    if (!item) {
      continue;
    }
    const group = groups.get(item) ?? [];
    group.push(match);
    groups.set(item, group);
  }
  const kickoffByMatch = new Map<SideMatch, string | undefined>();
  for (const [item, group] of groups) {
    if (group.length < 2) {
      kickoffByMatch.set(group[0], timedStart(item.start));
      continue;
    }
    const ordered = [...group].sort(byDoubleheaderOrder);
    const slots = splitWindow(item.start, item.end, ordered.length);
    ordered.forEach((match, index) => {
      kickoffByMatch.set(match, slots?.[index] ?? timedStart(item.start));
    });
  }
  return matches.map((match) => ({
    match,
    item: itemByMatch.get(match),
    kickoff: kickoffByMatch.get(match),
  }));
}

// Club convention on shared doubleheader days: the D3 (Lower Division)
// side plays the early game.
function byDoubleheaderOrder(a: SideMatch, b: SideMatch): number {
  return (a.side.label === 'D3' ? 0 : 1) - (b.side.label === 'D3' ? 0 : 1);
}

function timedStart(start: string): string | undefined {
  return start.includes('T') ? start : undefined;
}

function splitWindow(
  start: string,
  end: string,
  parts: number
): string[] | undefined {
  const from = new Date(start).getTime();
  const to = new Date(end).getTime();
  if (
    !start.includes('T') ||
    !end.includes('T') ||
    Number.isNaN(from) ||
    Number.isNaN(to) ||
    to <= from ||
    parts < 1
  ) {
    return undefined;
  }
  return Array.from({ length: parts }, (_, index) =>
    new Date(from + ((to - from) * index) / parts).toISOString()
  );
}
export function matchCalendarItem(
  match: SideMatch,
  items: CalendarSourceItem[]
): CalendarSourceItem | undefined {
  const dayKey = toLocalDayKey(match.fixture.dateTime);
  if (!dayKey) {
    return undefined;
  }
  const opponentCore = match.opponent
    .replace(/\s+(MD1|MD3|D1|D3)$/i, '')
    .trim()
    .toLowerCase();
  if (!opponentCore) {
    return undefined;
  }
  const candidates = items.filter((item) => {
    if (toLocalDayKey(item.start) !== dayKey) {
      return false;
    }
    const summary = (item.summary || '').toLowerCase();
    if (!summary.includes(opponentCore)) {
      return false;
    }
    return match.isGorgeHome ? summary.includes('vs') : summary.includes('@');
  });
  if (candidates.length === 0) {
    return undefined;
  }
  const label = match.side.label.toLowerCase();
  const labelled = candidates.filter((item) =>
    (item.summary || '').toLowerCase().includes(label)
  );
  const pool = labelled.length > 0 ? labelled : candidates;
  return (
    pool.sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    )[0]
  );
}

// Polling cadence: brisk while the page shows something current, calm
// otherwise, so a bookmarked Gameday stays fresh without hammering the API.
export const LIVE_POLL_MS = 60 * 1000;
export const FIXTURES_IDLE_POLL_MS = 5 * 60 * 1000;
export const CENTRE_IDLE_POLL_MS = 10 * 60 * 1000;

// A Match is live, upcoming, or settled. Forfeits read as Final — the
// score tells that story.
export type MatchStatus = 'Live' | 'Scheduled' | 'Final';

export function matchStatus(match: { status: string; isLive: boolean }): MatchStatus {
  if (match.isLive) {
    return 'Live';
  }
  return match.status === 'Fixture' ? 'Scheduled' : 'Final';
}

export function fixturesPollInterval(kind: GamedayKind): number {
  return kind === 'today' || kind === 'recap' ? LIVE_POLL_MS : FIXTURES_IDLE_POLL_MS;
}

// Minutely while the Match is live or within half an hour of kickoff
// (covering the kickoff transition when the live flag lags); calm otherwise.
const KICKOFF_WINDOW_MS = 30 * 60 * 1000;

export function centrePollInterval(
  match: { isLive?: boolean; dateTime: string },
  now: Date = new Date()
): number {
  if (match.isLive) {
    return LIVE_POLL_MS;
  }
  const kickoff = new Date(match.dateTime).getTime();
  if (
    !Number.isNaN(kickoff) &&
    Math.abs(now.getTime() - kickoff) <= KICKOFF_WINDOW_MS
  ) {
    return LIVE_POLL_MS;
  }
  return CENTRE_IDLE_POLL_MS;
}

// Resolves the venue string to point the map at: the calendar item's
// location wins; otherwise the feed venue unless it is blank or a TBA
// placeholder (no directions value, and the map would only mislead).
// Undefined when there is nowhere to point at.
export function resolveMatchLocation(
  calendarLocation: string | undefined,
  feedVenue: string | undefined
): string | undefined {
  const calendar = calendarLocation?.trim();
  if (calendar) {
    return calendar;
  }
  const venue = feedVenue?.trim();
  if (!venue || /^tba\b/i.test(venue)) {
    return undefined;
  }
  return venue;
}

// Date-only values (calendar all-day items) parse as UTC midnight under
// `new Date`, which lands on the previous local day west of Greenwich.
// Treat them as local midnight like the calendar utils do.
function parseDayInput(value: string): Date {
  if (!value.includes('T')) {
    const [year, month, day] = value.split('-').map(Number);
    if (year && month && day) {
      return new Date(year, month - 1, day);
    }
  }
  return new Date(value);
}

function dayStart(key: string): number {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day).getTime();
}

function dayDifference(laterKey: string, earlierKey: string): number {
  return Math.round((dayStart(laterKey) - dayStart(earlierKey)) / 86400000);
}
