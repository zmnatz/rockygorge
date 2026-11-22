import { useQuery } from "@tanstack/react-query";

import type { CalendarSourceItem } from "@/components/CalendarCard/types";

// Only the admin page reads the calendar in the browser, through pages/api/calendar.ts.
// The public pages read it on the server: src/utils/calendarServer.ts.
export function useCalendarSourceItems() {
  return useQuery({
    queryKey: ["/api/calendar"],
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<CalendarSourceItem[]> => {
      const res = await fetch("/api/calendar");
      if (!res.ok) throw new Error(`Calendar: HTTP ${res.status}`);
      return res.json();
    },
  });
}
