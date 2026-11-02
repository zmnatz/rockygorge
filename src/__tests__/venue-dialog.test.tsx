import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { PracticeWeatherSummary } from '@/utils/weather';

const mocks = vi.hoisted(() => ({
  weather: undefined as PracticeWeatherSummary | undefined,
}));

vi.mock('@/api/weather', () => ({
  useMatchWeather: () => ({ data: mocks.weather }),
}));

import { VenueDetails } from '@/components/Scores/VenueDialog';

const summary: PracticeWeatherSummary = {
  inclement: false,
  atPractice: false,
  earlierToday: false,
  atPracticeChance: 20,
  earlierChance: 0,
  weatherType: 'rain',
  maxPrecipitation: 0,
  temperatureAtPractice: 72,
};

function render(): string {
  return renderToStaticMarkup(
    <VenueDetails location="Supplee Lane" start="2026-09-19T17:00:00Z" />
  );
}

beforeEach(() => {
  mocks.weather = undefined;
});

describe('VenueDetails', () => {
  it('shows the map and directions for the venue', () => {
    mocks.weather = summary;
    const html = render();

    expect(html).toContain('maps.google.com/maps?q=Supplee%20Lane');
    expect(html).toContain(
      'https://www.google.com/maps/dir/?api=1&amp;destination=Supplee%20Lane'
    );
    expect(html).toContain('Get Directions');
  });

  it('shows match-day weather when available', () => {
    mocks.weather = summary;
    const html = render();

    expect(html).toContain('72°F at kickoff');
    expect(html).toContain('20% chance of rain during the match');
  });

  it('shows dry weather without a temperature', () => {
    mocks.weather = { ...summary, temperatureAtPractice: null, atPracticeChance: 0 };
    const html = render();

    expect(html).toContain('no precipitation expected during the match');
    expect(html).not.toContain('at kickoff');
  });

  it('shows the map without weather when the venue cannot be placed', () => {
    const html = render();

    expect(html).toContain('maps.google.com/maps?q=Supplee%20Lane');
    expect(html).not.toContain('at kickoff');
    expect(html).not.toContain('during the match');
  });
});
