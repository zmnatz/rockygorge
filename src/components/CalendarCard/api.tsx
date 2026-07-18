'use client'
import { useQuery } from "@tanstack/react-query";

import calendarInfo from '@/data/calendar.yml'
import { CalendarEvent } from "./types";
import { filterEvents } from "@/utils/calendar";


const startOfDay = new Date();
startOfDay.setHours(0, 0, 0, 0);
const endOfTime = new Date(startOfDay);
endOfTime.setMonth(endOfTime.getMonth() + calendarInfo.months);
endOfTime.setHours(23, 59, 59, 999);

export function useCalendarEvents() {
  return useQuery({
    queryKey: [
      "/api/calendar",
      "singleEvents=true",
      "orderBy=startTime",
      `timeMin=${startOfDay.toISOString()}`,
      `timeMax=${endOfTime.toISOString()}`,
    ],
    staleTime: 1000 * 60 * 5,
    placeholderData: {
      items: []
    },
    select: data => {
      const events = data.items.map(({summary, location, htmlLink, start, end}) => ({
        summary,
        location,
        htmlLink,
        start: start.dateTime ?? start.date,
        end: end.dateTime ?? end.date,
      }));

      return calendarInfo.filters.reduce(
        (results, filter) => ({
            ...results,
            [filter.name]: filterEvents(events, filter)
        }), {} as Record<string, CalendarEvent[]>
      )
    }
  });
}
