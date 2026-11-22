import calendarInfo from '@content/calendar.yml';
import type { CalendarAPIResponse, CalendarSourceItem } from '@/components/CalendarCard/types';
import { mapCalendarSourceItems } from '@/utils/calendar';

// The public pages read the club calendar on the server, in getServerSideProps, so the browser
// never asks for it. Server code only: never import this from a component.

/** How long the CDN keeps a page that shows the calendar. A plain `s-maxage`, with no
 *  `stale-while-revalidate`, so a page past its age is never served: the next visitor waits
 *  for a fresh render. */
export const CALENDAR_MAX_AGE_SECONDS = 15 * 60;
/** The home and Where is Practice pages, which show what is next, are kept for less. */
export const CALENDAR_SHORT_MAX_AGE_SECONDS = 5 * 60;
const cacheControl = (seconds: number) => `public, s-maxage=${seconds}`;
export const CALENDAR_CACHE_CONTROL = cacheControl(CALENDAR_MAX_AGE_SECONDS);
/** A failed read is cached briefly, so one bad moment isn't kept for the full age. */
export const CALENDAR_ERROR_CACHE_CONTROL = 'public, s-maxage=60';

const CALENDAR_ID = 't1s0l2ucm1fl084olhmj69pme8@group.calendar.google.com';

/** The upcoming items, or null when the calendar can't be read. Descriptions can be long, so
 *  they are dropped unless asked for (the admin page's endpoint keeps them). */
export async function fetchCalendarItems(
  now = new Date(),
  apiKey = process.env.GOOGLE_CALENDAR_API_KEY,
  keepDescriptions = false
): Promise<CalendarSourceItem[] | null> {
  if (!apiKey) return null;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + calendarInfo.months);
  end.setHours(23, 59, 59, 999);

  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    key: apiKey,
  });
  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?${params}`
    );
    if (!res.ok) return null;
    const body = (await res.json()) as CalendarAPIResponse;
    const items = mapCalendarSourceItems(body.items ?? []);
    return keepDescriptions ? items : items.map(({ description: _d, ...item }) => item);
  } catch {
    return null;
  }
}

/** Sets the page's cache header for what the calendar read returned. */
export function setCalendarCacheHeader(
  res: { setHeader(name: string, value: string): unknown },
  items: CalendarSourceItem[] | null,
  maxAgeSeconds = CALENDAR_MAX_AGE_SECONDS
) {
  res.setHeader(
    'Cache-Control',
    items ? cacheControl(maxAgeSeconds) : CALENDAR_ERROR_CACHE_CONTROL
  );
}
