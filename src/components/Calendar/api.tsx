'use client'
import { useQuery } from "@tanstack/react-query";

import calendarInfo from '@/data/calendar.yml'
import { CalendarEvent, CalendarFilter } from "./types";


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

function filterEvents(events: CalendarEvent[], criteria: CalendarFilter) {
  const { matches, notMatches, limit, hideSummary } = criteria;

  let results = events;
  if (matches) {
    results = results.filter(event => event.summary.match(new RegExp(matches, 'ig')));
  }
  if (notMatches) {
    results = results.filter(event => !event.summary.match(new RegExp(notMatches, 'ig')));
  }
  if (limit) {
    results = results.slice(0, limit);
  }
  if (hideSummary) {
    results = results.map(event => ({
      ...event,
      summary: ''
    }));
  }
  return results;
}

export function formatEventTime(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return start;
  }

  const sameDay = startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate();

  const formatDate = (date: Date, options: Intl.DateTimeFormatOptions) => date.toLocaleString("en-US", options);
  const isDateOnly = (value: string) => !value.includes("T");

  const formattedStartDate = formatDate(startDate, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const formattedEndDate = formatDate(endDate, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  if (isDateOnly(start) || isDateOnly(end)) {
    return sameDay ? formattedStartDate : `${formattedStartDate} - ${formattedEndDate}`;
  }

  if (sameDay) {
    const startTime = formatDate(startDate, {
      hour: "numeric",
      minute: "2-digit",
    });
    const endTime = formatDate(endDate, { hour: "numeric", minute: "2-digit" });
    return `${formattedStartDate} ${startTime} - ${endTime}`;
  }

  const formattedStart = `${formattedStartDate} ${formatDate(startDate, {
    hour: "numeric",
    minute: "2-digit",
  })}`;
  const formattedEnd = `${formattedEndDate} ${formatDate(endDate, {
    hour: "numeric",
    minute: "2-digit",
  })}`;
  return `${formattedStart} - ${formattedEnd}`;
}
