import { formatStartDate } from "@/utils/calendar";
import { Typography, Box } from "@mui/material";
import type { CalendarEvent } from "./types";

interface CalendarEventDetailProps {
  title: string;
  // Read on the server, by filter name; null when the calendar couldn't be read.
  events: Record<string, CalendarEvent[]> | null;
}

export function CalendarEventDetail({ title, events }: CalendarEventDetailProps) {
  if (!events) return null;

  // Look through all filtered calendars for a match
  const allEvents = Object.values(events).flat();
  const match = allEvents.find(event => 
    event.summary?.toLowerCase().includes(title.toLowerCase())
  );

  if (!match) return null;

  return (
    <Box sx={{ my: 2, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
      <Typography variant="subtitle2" color="text.secondary">Event Date & Time</Typography>
      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
        {formatStartDate(match.start)}
      </Typography>
      {match.location && (
        <>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Location</Typography>
          <Typography variant="body1">{match.location}</Typography>
        </>
      )}
    </Box>
  );
}
