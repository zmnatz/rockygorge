import { CalendarEvent, CalendarFilter } from "@/components/CalendarCard/types";

const parseDate = (dateStr: string) => {
  if (!dateStr.includes("T")) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(dateStr);
};

const formatDate = (date: Date, options: Intl.DateTimeFormatOptions) => date.toLocaleString("en-US", options);
const isDateOnly = (value: string) => !value.includes("T");

export function filterEvents(events: CalendarEvent[], criteria: CalendarFilter) {
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
  const startDate = parseDate(start);
  let endDate = parseDate(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return start;
  }

  // Google Calendar all-day events have an exclusive end date.
  // If both are date-only, subtract one day from the end date for display.
  if (!start.includes("T") && !end.includes("T")) {
    endDate.setDate(endDate.getDate() - 1);
  }

  const sameDay = startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate();

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

export function formatStartDate(start: string) {
  const startDate = parseDate(start);
  if (Number.isNaN(startDate.getTime())) return start;

  const formattedStartDate = formatDate(startDate, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  if (isDateOnly(start)) {
    return formattedStartDate;
  }

  return `${formattedStartDate} ${formatDate(startDate, {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}
