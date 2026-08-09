import { useQuery } from "@tanstack/react-query";

import calendarInfo from '@content/calendar.yml'
import type { CalendarEvent, CalendarAPIResponse, CalendarSourceItem } from "@/components/CalendarCard/types";
import { filterEvents, mapCalendarSourceItems } from "@/utils/calendar";


const startOfDay = new Date();
startOfDay.setHours(0, 0, 0, 0);
const endOfTime = new Date(startOfDay);
endOfTime.setMonth(endOfTime.getMonth() + calendarInfo.months);
endOfTime.setHours(23, 59, 59, 999);

const calendarQueryKey = [
  "/api/calendar",
  "singleEvents=true",
  "orderBy=startTime",
  `timeMin=${startOfDay.toISOString()}`,
  `timeMax=${endOfTime.toISOString()}`,
];

const calendarQueryOptions = {
  staleTime: 1000 * 60 * 5,
  placeholderData: { items: [] } as CalendarAPIResponse,
};

export function useCalendarEvents() {
  return useQuery({
    queryKey: calendarQueryKey,
    ...calendarQueryOptions,
    select: (data: CalendarAPIResponse) => {
      const events = mapCalendarSourceItems(data.items).map(
        ({ description, ...event }) => event
      );

      const results: Record<string, CalendarEvent[]> = {};
      for (const filter of calendarInfo.filters) {
        results[filter.name] = filterEvents(events, filter);
      }
      return results;
    }
  });
}

export function useCalendarSourceItems() {
  return useQuery({
    queryKey: calendarQueryKey,
    ...calendarQueryOptions,
    select: (data: CalendarAPIResponse): CalendarSourceItem[] =>
      mapCalendarSourceItems(data.items),
  });
}
