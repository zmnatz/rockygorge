import { describe, expect, it } from 'vitest';
import { mergeScores } from '@/api/scores';
import type { Score } from '@/components/Scores/types';

function score(id: string, dateTime: string, homeScore = '20'): Score {
  return {
    id,
    dateTime,
    compName: 'Test Comp',
    homeTeam: { id: 'h', name: 'Rocky Gorge', teamId: 'h', score: homeScore, crest: '' },
    awayTeam: { id: 'a', name: 'Opponent', teamId: 'a', score: '10', crest: '' },
  } as Score;
}

describe('mergeScores', () => {
  it('returns live games when there is no static snapshot', () => {
    const live = [score('1', '2026-09-01'), score('2', '2026-08-01')];
    expect(mergeScores(live, []).map((s) => s.id)).toEqual(['1', '2']);
  });

  it('fills in newer live games ahead of the static snapshot', () => {
    const stat = [score('old', '2026-08-01')];
    const live = [score('new', '2026-09-10'), score('old', '2026-08-01')];
    expect(mergeScores(live, stat).map((s) => s.id)).toEqual(['new', 'old']);
  });

  it('retains static-only games and sorts newest first', () => {
    const live = [score('b', '2026-09-01')];
    const stat = [score('c', '2026-07-01'), score('a', '2026-09-05')];
    expect(mergeScores(live, stat).map((s) => s.id)).toEqual(['a', 'b', 'c']);
  });

  it('prefers the live copy on duplicate ids', () => {
    const live = [score('1', '2026-09-01', '30')];
    const stat = [score('1', '2026-09-01', '20')];
    const merged = mergeScores(live, stat);
    expect(merged).toHaveLength(1);
    expect(merged[0].homeTeam.score).toBe('30');
  });
});
