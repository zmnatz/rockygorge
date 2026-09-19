import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ScoreCard } from '@/components/Scores/ScoreCard';
import type { Score } from '@/components/Scores/types';

function score(): Score {
  return {
    id: 'f1',
    dateTime: '2026-09-19T17:00:00Z',
    compName: 'MAC Men D1',
    homeTeam: { id: 'h', name: 'Rocky Gorge MD1', teamId: 'h', score: '', crest: '' },
    awayTeam: { id: 'a', name: 'Washington MD1', teamId: 'a', score: '', crest: '' },
  } as Score;
}

describe('ScoreCard', () => {
  it('shows the competition, date, and kickoff time', () => {
    const html = renderToStaticMarkup(<ScoreCard score={score()} />);

    expect(html).toContain('MAC Men D1');
    expect(html).toMatch(/\d{1,2}:\d{2}/);
  });

  it('shows a location button when a venue is passed', () => {
    const html = renderToStaticMarkup(
      <ScoreCard score={score()} location="Supplee Lane" />
    );

    expect(html).toContain('Supplee Lane');
  });

  it('shows no location button without a venue', () => {
    const html = renderToStaticMarkup(<ScoreCard score={score()} />);

    expect(html).not.toContain('Supplee Lane');
  });

  it('prefers the calendar kickoff over the feed time', () => {
    const kickoff = '2026-09-19T15:00:00Z';
    const withFeed = renderToStaticMarkup(<ScoreCard score={score()} />);
    const withCalendar = renderToStaticMarkup(
      <ScoreCard score={score()} kickoff={kickoff} />
    );

    expect(withCalendar).not.toBe(withFeed);
    expect(withCalendar).toContain(
      new Date(kickoff).toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      })
    );
  });
});
