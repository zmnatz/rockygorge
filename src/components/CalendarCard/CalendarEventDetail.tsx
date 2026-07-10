'use client'
import { useCalendarEvents, formatStartDate } from "./api";
import { Typography, Box, CircularProgress } from "@mui/material";

interface CalendarEventDetailProps {
  title: string;
}

export function CalendarEventDetail({ title }: CalendarEventDetailProps) {
  const { data, isFetching, error } = useCalendarEvents();

  if (isFetching) return <CircularProgress size={20} />;
  if (error || !data) return null;

  // Look through all filtered calendars for a match
  const allEvents = Object.values(data).flat();
  const match = allEvents.find(event => 
    event.summary && event.summary.toLowerCase().includes(title.toLowerCase())
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
