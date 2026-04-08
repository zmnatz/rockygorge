import { useQuery } from "@tanstack/react-query";

export type CalendarEvent = {
  summary: string;
  location: string;
  htmlLink: string;
  start: string;
  end: string;
};

export async function fetchCalendarEvents(query: string) {
  const params = [
    query,
    "singleEvents=true",
    "orderBy=startTime",
    `timeMin=${new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join("&");

  const response = await fetch(`/api/calendar?${params}`);
  const json = await response.json();
  const summary = json.items.map(({summary, location, htmlLink, start, end}) => ({
    summary,
    location,
    htmlLink,
    start: start.dateTime ?? start.date,
    end: end.dateTime ?? end.date,
  }));
  return summary;
}

export async function getPracticeEvents() {
  const now = new Date();
  const endOfNextWeek = new Date(now);
  endOfNextWeek.setDate(endOfNextWeek.getDate() + (13 - endOfNextWeek.getDay()));
  endOfNextWeek.setHours(23, 59, 59, 999);
  const timeMax = endOfNextWeek.toISOString();
  
  return await fetchCalendarEvents(`q=practice&maxResults=4&singleEvents=true&orderBy=startTime&timeMax=${timeMax}`);
}

export function usePracticeEvents() {
  return useQuery<CalendarEvent[]>({
    queryKey: ["practiceEvents"],
    queryFn: getPracticeEvents,
    staleTime: 1000 * 60 * 5,
    placeholderData: []
  });
}

export async function getMatchEvents() {
  const now = new Date();
  const endOfTwoMonths = new Date(now);
  endOfTwoMonths.setMonth(endOfTwoMonths.getMonth() + 2);
  endOfTwoMonths.setHours(23, 59, 59, 999);
  const timeMax = endOfTwoMonths.toISOString();
  
  return await fetchCalendarEvents(`timeMax=${timeMax}`)
}

export function useMatchEvents() {
  return useQuery<CalendarEvent[]>({
    queryKey: ['matchEvents'],
    queryFn: getMatchEvents,
    staleTime: 1000 & 60 * 5,
    select: (data) => data.filter(event => !event.summary.match(/practice|board|OG|Africa/ig)),
    placeholderData: []
  })
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
