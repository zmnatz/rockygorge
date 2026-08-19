import { useQuery } from "@tanstack/react-query";

import type { PracticeField } from "@/types/practice-field";
import {
  PRACTICE_TIMEZONE,
  summarizeInclementWeather,
  zonedDateKey,
  type OpenMeteoForecastResponse,
  type PracticeWeatherSummary,
} from "@/utils/weather";

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";

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
    queryFn: async (): Promise<PracticeWeatherSummary> => {
      const practiceDay = zonedDateKey(new Date(practiceStart as string), PRACTICE_TIMEZONE);
      const params = new URLSearchParams({
        latitude: String((field as PracticeField).lat),
        longitude: String((field as PracticeField).lon),
        hourly: "temperature_2m,precipitation_probability,precipitation,weather_code",
        timezone: PRACTICE_TIMEZONE,
        temperature_unit: "fahrenheit",
        start_date: practiceDay,
        end_date: practiceDay,
      });

      const res = await fetch(`${OPEN_METEO_URL}?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Weather request failed with status ${res.status}`);
      }
      const data = (await res.json()) as OpenMeteoForecastResponse;
      return summarizeInclementWeather(data.hourly, practiceStart as string, practiceEnd as string);
    },
  });
}
