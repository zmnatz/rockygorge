'use client';

import { Box, CircularProgress, Link as MuiLink, Typography } from "@mui/material";
import Link from "next/link";
import { useCalendarSourceItems } from "@/api/calendar";
import calendarInfo from "@content/calendar.yml";
import { findNextPractice, formatEventTime } from "@/utils/calendar";

const mapsEmbedUrl = (location: string) =>
  `https://maps.google.com/maps?q=${encodeURIComponent(location)}&output=embed`;

export function WhereIsPractice() {
  const { data, isFetching, error } = useCalendarSourceItems();

  if (isFetching) return <CircularProgress size={20} />;
  if (error || !data) {
    return (
      <Box sx={{ my: 2 }}>
        <Typography variant="body1" color="error">
          We couldn't load the calendar right now.
        </Typography>
      </Box>
    );
  }

  const next = findNextPractice(data, calendarInfo.filters);

  if (!next) {
    return (
      <Box sx={{ my: 2 }}>
        <Typography variant="body1">
          No practice is currently scheduled. Check the{" "}
          <MuiLink component={Link} href="/calendar">full calendar</MuiLink>.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ my: 2, p: 2, bgcolor: "action.hover", borderRadius: 2 }}>
      <Typography variant="subtitle2" color="text.secondary">Next Practice</Typography>
      <Typography variant="body1" sx={{ fontWeight: "bold" }}>
        {formatEventTime(next.start, next.end)}
      </Typography>

      {next.location ? (
        <>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Location</Typography>
          <Typography variant="body1">{next.location}</Typography>
          <Box
            component="iframe"
            title={`Map of ${next.location}`}
            src={mapsEmbedUrl(next.location)}
            sx={{ width: "100%", height: 400, border: 0, my: 2, borderRadius: 1 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </>
      ) : (
        <Typography variant="body1">
          For the latest practice location, check the team WhatsApp group.
        </Typography>
      )}

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <MuiLink href={next.htmlLink} target="_blank" rel="noopener noreferrer">
          Open in Google Calendar
        </MuiLink>
        <MuiLink component={Link} href="/calendar">Full calendar</MuiLink>
      </Box>
    </Box>
  );
}
