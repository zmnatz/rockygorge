import { describe, it, expect } from 'vitest';
import {
  summarizeInclementWeather,
  weatherCodeToType,
  zonedNaiveToUtc,
  type OpenMeteoHourly,
} from '@/utils/weather';

const fromEntries = (
  entries: Record<string, { prob?: number; precip?: number; code?: number }>,
): OpenMeteoHourly => {
  const time: string[] = [];
  const precipitation_probability: number[] = [];
  const precipitation: number[] = [];
  const weather_code: number[] = [];
  for (const [t, v] of Object.entries(entries)) {
    time.push(t);
    precipitation_probability.push(v.prob ?? 0);
    precipitation.push(v.precip ?? 0);
    weather_code.push(v.code ?? 0);
  }
  return { time, precipitation_probability, precipitation, weather_code };
};

const PRACTICE_DAY = '2026-08-18';
const PRACTICE_START = `${PRACTICE_DAY}T19:45:00-04:00`;
const PRACTICE_END = `${PRACTICE_DAY}T21:45:00-04:00`;

describe('zonedNaiveToUtc', () => {
  it('interprets the naive time in the requested timezone (EDT, UTC-4)', () => {
    const result = zonedNaiveToUtc('2026-08-18T12:00', 'America/New_York');
    expect(result.getTime()).toBe(new Date('2026-08-18T16:00:00Z').getTime());
  });

  it('handles standard time (EST, UTC-5)', () => {
    const result = zonedNaiveToUtc('2026-01-13T12:00', 'America/New_York');
    expect(result.getTime()).toBe(new Date('2026-01-13T17:00:00Z').getTime());
  });
});

describe('weatherCodeToType', () => {
  it('returns null for dry and cloudy codes', () => {
    expect(weatherCodeToType(0)).toBeNull();
    expect(weatherCodeToType(3)).toBeNull();
  });

  it('maps precipitation codes to labels', () => {
    expect(weatherCodeToType(61)).toBe('rain');
    expect(weatherCodeToType(71)).toBe('snow');
    expect(weatherCodeToType(80)).toBe('showers');
    expect(weatherCodeToType(95)).toBe('thunderstorms');
    expect(weatherCodeToType(51)).toBe('drizzle');
  });
});

describe('summarizeInclementWeather', () => {
  it('flags rain earlier in the same day before practice', () => {
    const summary = summarizeInclementWeather(
      fromEntries({ '2026-08-18T14:00': { prob: 70, precip: 1.2, code: 61 } }),
      PRACTICE_START,
      PRACTICE_END,
    );
    expect(summary.inclement).toBe(true);
    expect(summary.earlierToday).toBe(true);
    expect(summary.atPractice).toBe(false);
    expect(summary.earlierChance).toBe(70);
    expect(summary.weatherType).toBe('rain');
  });

  it('flags rain forecast during the practice window', () => {
    const summary = summarizeInclementWeather(
      fromEntries({ '2026-08-18T20:00': { prob: 90, precip: 0.8, code: 61 } }),
      PRACTICE_START,
      PRACTICE_END,
    );
    expect(summary.inclement).toBe(true);
    expect(summary.atPractice).toBe(true);
    expect(summary.earlierToday).toBe(false);
    expect(summary.atPracticeChance).toBe(90);
  });

  it('flags when rain is expected both earlier and at practice time', () => {
    const summary = summarizeInclementWeather(
      fromEntries({
        '2026-08-18T13:00': { prob: 80, code: 61 },
        '2026-08-18T20:00': { prob: 60, code: 61 },
      }),
      PRACTICE_START,
      PRACTICE_END,
    );
    expect(summary.inclement).toBe(true);
    expect(summary.atPractice).toBe(true);
    expect(summary.earlierToday).toBe(true);
  });

  it('does not flag probability below the threshold', () => {
    const summary = summarizeInclementWeather(
      fromEntries({ '2026-08-18T14:00': { prob: 30, code: 61 } }),
      PRACTICE_START,
      PRACTICE_END,
    );
    expect(summary.inclement).toBe(false);
  });

  it('does not flag a dry forecast', () => {
    const summary = summarizeInclementWeather(
      fromEntries({ '2026-08-18T20:00': { prob: 0, code: 0 } }),
      PRACTICE_START,
      PRACTICE_END,
    );
    expect(summary.inclement).toBe(false);
  });

  it('ignores rain after practice ends', () => {
    const summary = summarizeInclementWeather(
      fromEntries({ '2026-08-18T23:00': { prob: 95, code: 61 } }),
      PRACTICE_START,
      PRACTICE_END,
    );
    expect(summary.inclement).toBe(false);
  });

  it('treats snow as inclement and reports the type', () => {
    const summary = summarizeInclementWeather(
      fromEntries({ '2026-08-18T20:00': { prob: 80, code: 71 } }),
      PRACTICE_START,
      PRACTICE_END,
    );
    expect(summary.inclement).toBe(true);
    expect(summary.weatherType).toBe('snow');
  });

  it('tracks the maximum expected precipitation among relevant hours', () => {
    const summary = summarizeInclementWeather(
      fromEntries({
        '2026-08-18T10:00': { prob: 50, precip: 3.1, code: 61 },
        '2026-08-18T20:00': { prob: 90, precip: 0.4, code: 61 },
      }),
      PRACTICE_START,
      PRACTICE_END,
    );
    expect(summary.maxPrecipitation).toBe(3.1);
  });

  it('handles standard time (EST) practice days', () => {
    const summary = summarizeInclementWeather(
      fromEntries({ '2026-01-13T16:00': { prob: 70, code: 61 } }),
      '2026-01-13T19:45:00-05:00',
      '2026-01-13T21:45:00-05:00',
    );
    expect(summary.inclement).toBe(true);
    expect(summary.earlierToday).toBe(true);
  });

  it('treats a date-only practice as an all-day window', () => {
    const summary = summarizeInclementWeather(
      fromEntries({ '2026-08-18T08:00': { prob: 70, code: 61 } }),
      PRACTICE_DAY,
      PRACTICE_DAY,
    );
    expect(summary.inclement).toBe(true);
    expect(summary.atPractice).toBe(true);
    expect(summary.earlierToday).toBe(false);
  });
});
