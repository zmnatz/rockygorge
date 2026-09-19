import { useQuery } from "@tanstack/react-query";

import practiceFieldsConfig from "@config/practice-fields.yml";
import { findPracticeField } from "@/utils/practice-fields";
import type { PracticeField } from "@/types/practice-field";
import {
  PRACTICE_TIMEZONE,
  parseGeocodeResponse,
  summarizeInclementWeather,
  zonedDateKey,
  type GeocodedLocation,
  type OpenMeteoForecastResponse,
  type PracticeWeatherSummary,
} from "@/utils/weather";

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";

async function fetchWindowSummary(
  lat: number,
  lon: number,
  start: string,
  end: string,
): Promise<PracticeWeatherSummary> {
  const day = zonedDateKey(new Date(start), PRACTICE_TIMEZONE);
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: "temperature_2m,precipitation_probability,precipitation,weather_code",
    timezone: PRACTICE_TIMEZONE,
    temperature_unit: "fahrenheit",
    start_date: day,
    end_date: day,
  });

  const res = await fetch(`${OPEN_METEO_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Weather request failed with status ${res.status}`);
  }
  const data = (await res.json()) as OpenMeteoForecastResponse;
  return summarizeInclementWeather(data.hourly, start, end);
}

/**
 * Fetches the day-of forecast at a PracticeField and summarizes whether it is
 * inclement weather for the given practice window.
 */
export function usePracticeWeather(
  field: PracticeField | undefined,
  practiceStart: string | undefined,
  practiceEnd: string | undefined,
) {
  return useQuery({
    queryKey: ["weather", "open-meteo", field?.id, practiceStart, practiceEnd],
    enabled: Boolean(field && practiceStart && practiceEnd),
    staleTime: 1000 * 60 * 30,
    queryFn: async (): Promise<PracticeWeatherSummary> =>
      fetchWindowSummary(
        (field as PracticeField).lat,
        (field as PracticeField).lon,
        practiceStart as string,
        practiceEnd as string,
      ),
  });
}

/**
 * Match-day weather at an arbitrary venue: known club fields resolve to
 * their configured coordinates, anything else goes through Open-Meteo
 * geocoding. The forecast is summarized over the match window. Data stays
 * undefined while resolving, or when the venue can't be placed or the
 * forecast fails — callers render the map without weather then.
 */
export function useMatchWeather(
  location: string | undefined,
  matchStart: string | undefined,
  matchEnd: string | undefined,
) {
  const field = location
    ? findPracticeField(location, practiceFieldsConfig.fields)
    : undefined;

  const geocodeQuery = useQuery({
    queryKey: ["weather", "geocode", location],
    // A venue's coordinates never change.
    staleTime: Infinity,
    enabled: !field && !!location,
    queryFn: async (): Promise<GeocodedLocation | null> => {
      const params = new URLSearchParams({
        name: location as string,
        count: "1",
        language: "en",
        format: "json",
      });
      const res = await fetch(`${GEOCODE_URL}?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Geocode request failed with status ${res.status}`);
      }
      return parseGeocodeResponse(await res.json());
    },
  });

  const lat = field?.lat ?? geocodeQuery.data?.lat;
  const lon = field?.lon ?? geocodeQuery.data?.lon;

  return useQuery({
    queryKey: ["weather", "open-meteo", "match", lat, lon, matchStart, matchEnd],
    enabled: lat !== undefined && lon !== undefined && !!matchStart && !!matchEnd,
    staleTime: 1000 * 60 * 30,
    queryFn: async (): Promise<PracticeWeatherSummary> =>
      fetchWindowSummary(
        lat as number,
        lon as number,
        matchStart as string,
        matchEnd as string,
      ),
  });
}
