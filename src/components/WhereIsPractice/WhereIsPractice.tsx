'use client';

import { useEffect, useState } from "react";
import { Box, CircularProgress, Link as MuiLink, Typography } from "@mui/material";
import Link from "next/link";
import { useCalendarSourceItems } from "@/api/calendar";
import { usePracticeWeather } from "@/api/weather";
import calendarInfo from "@content/calendar.yml";
import practiceFieldsConfig from "@config/practice-fields.yml";
import type { PracticeField } from "@/types/practice-field";
import { findNextPractice, formatEventTime } from "@/utils/calendar";
import { findPracticeField } from "@/utils/practice-fields";
import type { PracticeWeatherSummary } from "@/utils/weather";

const mapsEmbedUrl = (location: string) =>
  `https://maps.google.com/maps?q=${encodeURIComponent(location)}&output=embed`;

const statusfyEmbedUrl = (extensionId: number, embedId: string) =>
  `https://statusfy.com/2402631223/list?detail=0&extensions=${extensionId}&id=${embedId}`;

function FieldStatusPanel({ field, start, end }: { field: PracticeField; start: string; end: string }) {
  const { data: weather } = usePracticeWeather(field, start, end);
  const embedId = `stsfy-${field.id}`;
  const [height, setHeight] = useState(100);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { i?: string; h?: number };
      if (
        event.origin === "https://statusfy.com" &&
        data &&
        typeof data === "object" &&
        data.i === embedId &&
        typeof data.h === "number"
      ) {
        setHeight(data.h);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [embedId]);

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" color="text.secondary">Field Status</Typography>
      <Box
        component="iframe"
        title={`Field status for ${field.label}`}
        src={statusfyEmbedUrl(field.extensionId, embedId)}
        sx={{ width: "100%", height, border: 0, my: 1, borderRadius: 1 }}
        loading="lazy"
      />
      {weather ? <WeatherForecast summary={weather} /> : null}
    </Box>
  );
}

function WeatherForecast({ summary }: { summary: PracticeWeatherSummary }) {
  const { atPractice, earlierToday, atPracticeChance, weatherType, maxPrecipitation, temperatureAtPractice } = summary;
  const type = weatherType ?? "precipitation";
  const amount = maxPrecipitation > 0 ? `, ~${(maxPrecipitation / 25.4).toFixed(2)}" expected` : "";
  const precip = atPracticeChance > 0
    ? `${atPracticeChance}% chance of ${type}${amount}`
    : "no precipitation expected";
  const temp = temperatureAtPractice === null ? "" : `${Math.round(temperatureAtPractice)}°F at practice time · `;
  const timing = atPractice && earlierToday
    ? "before and during practice"
    : atPractice
      ? "around practice time"
      : "earlier in the day";

  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
        {`${temp}${precip}`}
      </Typography>
      {summary.inclement ? (
        <>
          <Typography variant="body2">
            {`${type.charAt(0).toUpperCase()}${type.slice(1)} expected ${timing} — the field may be closed.`}
          </Typography>
          <Typography variant="body2">
            Practice may move to a turf field; check the WhatsApp group for the latest.
          </Typography>
        </>
      ) : null}
    </Box>
  );
}

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

  const field = next.location ? findPracticeField(next.location, practiceFieldsConfig.fields) : undefined;

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
          {field ? <FieldStatusPanel field={field} start={next.start} end={next.end} /> : null}
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
