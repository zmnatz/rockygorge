import type { NextApiRequest, NextApiResponse } from 'next';
import type { CalendarSourceItem } from '@/components/CalendarCard/types';
import {
  CALENDAR_SHORT_MAX_AGE_SECONDS,
  fetchCalendarItems,
  setCalendarCacheHeader,
} from '@/utils/calendarServer';

// The club calendar as JSON, for the admin page's "Generate from calendar" panel, which
// needs the descriptions. The calendar is public, so there is no sign-in. Cached by the CDN
// for 5 minutes, with no stale copy served (src/utils/calendarServer.ts).
export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<CalendarSourceItem[] | { error: string }>
) {
  const items = await fetchCalendarItems(new Date(), process.env.GOOGLE_CALENDAR_API_KEY, true);
  setCalendarCacheHeader(res, items, CALENDAR_SHORT_MAX_AGE_SECONDS);
  if (!items) return res.status(502).json({ error: 'The calendar could not be read.' });
  return res.status(200).json(items);
}
