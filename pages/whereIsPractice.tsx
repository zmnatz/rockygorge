import { useMemo } from 'react';
import type { GetServerSideProps } from 'next';
import type { CalendarSourceItem } from '@/components/CalendarCard/types';
import { WhereIsPractice } from '@/components/WhereIsPractice/WhereIsPractice';
import Content from '@/components/WhereIsPractice/WhereIsPracticeContent.mdx';
import {
  CALENDAR_SHORT_MAX_AGE_SECONDS,
  fetchCalendarItems,
  setCalendarCacheHeader,
} from '@/utils/calendarServer';

// Rendered on request, with the CDN keeping the page for 5 minutes and serving no stale
// copy (src/utils/calendarServer.ts), so the next practice comes from the calendar on the
// server.
export const getServerSideProps: GetServerSideProps<{ items: CalendarSourceItem[] | null }> = async ({
  res,
}) => {
  const items = await fetchCalendarItems();
  setCalendarCacheHeader(res, items, CALENDAR_SHORT_MAX_AGE_SECONDS);
  return { props: { items } };
};

export default function WhereIsPracticePage({ items }: { items: CalendarSourceItem[] | null }) {
  const components = useMemo(() => ({ WhereIsPractice: () => <WhereIsPractice items={items} /> }), [items]);
  return <Content components={components} />;
}
