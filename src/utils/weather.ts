export const PRACTICE_TIMEZONE = "America/New_York";
export const INCLEMENT_PRECIP_PROBABILITY = 40;

export interface OpenMeteoHourly {
  time: string[];
  precipitation_probability: number[];
  precipitation: number[];
  weather_code: number[];
}

export interface OpenMeteoForecastResponse {
  hourly: OpenMeteoHourly;
}

export interface PracticeWeatherSummary {
  inclement: boolean;
  atPractice: boolean;
  earlierToday: boolean;
  atPracticeChance: number;
  earlierChance: number;
  weatherType: string | null;
  maxPrecipitation: number;
}

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const pad = (value: number) => String(value).padStart(2, "0");

const zonedParts = (date: Date, timeZone: string): ZonedParts => {
  const values: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date)) {
    values[part.type] = part.value;
  }
  const hour = values.hour === "24" ? "00" : values.hour;
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
};

const asUtcMs = (parts: ZonedParts) =>
  Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);

/** The UTC instant whose wall-clock time in `timeZone` equals `naive` ("YYYY-MM-DDTHH:mm"). */
export function zonedNaiveToUtc(naive: string, timeZone: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(naive);
  if (!match) return new Date(naive);

  const parts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: match[6] ? Number(match[6]) : 0,
  };

  const guess = asUtcMs(parts);
  const offsetAt = (ms: number) => asUtcMs(zonedParts(new Date(ms), timeZone)) - ms;

  let result = guess;
  for (let i = 0; i < 2; i += 1) {
    result = guess - offsetAt(result);
  }
  return new Date(result);
}

/** The wall-clock date ("YYYY-MM-DD") of `date` in `timeZone`. */
export function zonedDateKey(date: Date, timeZone: string): string {
  const p = zonedParts(date, timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

const isDateOnly = (value: string) => !value.includes("T");

/** Maps an Open-Meteo weather code to a short human label, or null when dry. */
export function weatherCodeToType(code: number): string | null {
  if (code === 45 || code === 48) return "fog";
  if (code === 51 || code === 53 || code === 55 || code === 56 || code === 57) return "drizzle";
  if (code === 61 || code === 63 || code === 65 || code === 66 || code === 67) return "rain";
  if (code === 71 || code === 73 || code === 75 || code === 77) return "snow";
  if (code === 80 || code === 81 || code === 82) return "showers";
  if (code === 85 || code === 86) return "snow showers";
  if (code === 95 || code === 96 || code === 99) return "thunderstorms";
  return null;
}

type RelevantHour = {
  window: "atPractice" | "earlierToday";
  probability: number;
  precipitation: number;
  code: number;
};

/**
 * Determines whether the forecast for a practice is "inclement weather": at
 * least `threshold` percent precipitation probability either during the
 * practice window or at any earlier hour on the same calendar day at the
 * field. Date-only practice values are treated as an all-day practice window.
 */
export function summarizeInclementWeather(
  hourly: OpenMeteoHourly,
  practiceStart: string,
  practiceEnd: string,
  threshold: number = INCLEMENT_PRECIP_PROBABILITY,
  timeZone: string = PRACTICE_TIMEZONE,
): PracticeWeatherSummary {
  const startDate = new Date(practiceStart);

  let dayStart: Date;
  let startAbs: Date;
  let endAbs: Date;
  if (isDateOnly(practiceStart)) {
    dayStart = zonedNaiveToUtc(`${practiceStart}T00:00`, timeZone);
    startAbs = dayStart;
    endAbs = zonedNaiveToUtc(`${practiceStart}T23:59`, timeZone);
  } else {
    startAbs = startDate;
    endAbs = new Date(practiceEnd);
    dayStart = zonedNaiveToUtc(`${zonedDateKey(startDate, timeZone)}T00:00`, timeZone);
  }

  let atPracticeChance = 0;
  let earlierChance = 0;
  let dominant: RelevantHour | null = null;
  let maxPrecipitation = 0;

  for (let i = 0; i < hourly.time.length; i += 1) {
    const hourDate = zonedNaiveToUtc(hourly.time[i], timeZone);
    const probability = hourly.precipitation_probability[i] ?? 0;
    const precipitation = hourly.precipitation[i] ?? 0;

    const window =
      hourDate >= startAbs && hourDate < endAbs
        ? "atPractice"
        : hourDate >= dayStart && hourDate < startAbs
          ? "earlierToday"
          : null;
    if (!window) continue;

    if (window === "atPractice" && probability > atPracticeChance) {
      atPracticeChance = probability;
    }
    if (window === "earlierToday" && probability > earlierChance) {
      earlierChance = probability;
    }
    if (precipitation > maxPrecipitation) {
      maxPrecipitation = precipitation;
    }
    if (!dominant || probability > dominant.probability) {
      dominant = { window, probability, precipitation, code: hourly.weather_code[i] ?? 0 };
    }
  }

  const atPractice = atPracticeChance >= threshold;
  const earlierToday = earlierChance >= threshold;

  return {
    inclement: atPractice || earlierToday,
    atPractice,
    earlierToday,
    atPracticeChance,
    earlierChance,
    weatherType: dominant ? weatherCodeToType(dominant.code) : null,
    maxPrecipitation,
  };
}
