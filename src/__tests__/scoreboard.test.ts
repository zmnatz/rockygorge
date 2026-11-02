import { describe, expect, it } from 'vitest';
import {
  activeStreaks,
  defenseLeaders,
  formatPct,
  formatStreak,
  lastFive,
  longestWinStreak,
  outcomeOf,
  pointsLeaders,
  seasonSummary,
  teamAbbreviation,
  teamCrest,
  teamRecord,
  teamResults,
  teamSide,
  teamStreak,
  winPct,
} from '@/utils/scoreboard';
import type { CapitalFixture } from '@/api/capital';

function fixture(
  id: string,
  home: string,
  homeScore: string,
  away: string,
  awayScore: string,
  dateTime = '2026-03-01T17:00:00+00:00'
): CapitalFixture {
  return {
    id,
    compId: 'd3',
    compName: 'Capital Men D3',
    season: '2025/2026',
    dateTime,
    round: 'Round 1',
    roundLabel: '',
    status: 'Result',
    sourceType: '2',
    homeTeam: { name: home, score: homeScore, crest: `${home}-crest` },
    awayTeam: { name: away, score: awayScore, crest: `${away}-crest` },
  };
}

describe('teamSide / outcomeOf', () => {
  const game = fixture('1', 'Rocky Gorge MD3', '20', 'NOVA MD3', '10');

  it('identifies the home and away side', () => {
    expect(teamSide(game, 'Rocky Gorge MD3')).toBe('home');
    expect(teamSide(game, 'NOVA MD3')).toBe('away');
    expect(teamSide(game, 'Severn River MD3')).toBeNull();
  });

  it('scores the result from each perspective', () => {
    expect(outcomeOf(game, 'Rocky Gorge MD3')).toBe('W');
    expect(outcomeOf(game, 'NOVA MD3')).toBe('L');
  });

  it('detects draws and scoreless games', () => {
    expect(outcomeOf(fixture('2', 'A', '10', 'B', '10'), 'A')).toBe('D');
    expect(outcomeOf(fixture('3', 'A', '', 'B', ''), 'A')).toBeNull();
  });
});

describe('teamRecord', () => {
  it('aggregates wins, losses, draws and points', () => {
    const fixtures = [
      fixture('1', 'Rocky Gorge MD3', '20', 'NOVA MD3', '10'),
      fixture('2', 'Severn River MD3', '30', 'Rocky Gorge MD3', '24'),
      fixture('3', 'Rocky Gorge MD3', '15', 'Potomac MD3', '15'),
    ];
    expect(teamRecord(fixtures, 'Rocky Gorge MD3')).toEqual({
      played: 3,
      won: 1,
      lost: 1,
      drawn: 1,
      pointsFor: 59,
      pointsAgainst: 55,
    });
  });

  it('ignores games the team is not involved in', () => {
    const fixtures = [fixture('1', 'A', '20', 'B', '10')];
    expect(teamRecord(fixtures, 'Rocky Gorge MD3').played).toBe(0);
  });
});

describe('teamStreak / lastFive', () => {
  const fixtures = [
    fixture('1', 'Rocky Gorge MD3', '20', 'A', '10', '2026-03-01T17:00:00+00:00'),
    fixture('2', 'Rocky Gorge MD3', '30', 'B', '10', '2026-03-08T17:00:00+00:00'),
    fixture('3', 'C', '25', 'Rocky Gorge MD3', '10', '2026-03-15T17:00:00+00:00'),
  ];

  it('reads the current run from the most recent games', () => {
    expect(teamStreak(fixtures, 'Rocky Gorge MD3')).toEqual({
      code: 'L',
      count: 1,
    });
  });

  it('counts back through consecutive identical outcomes', () => {
    const wins = fixtures.slice(0, 2);
    expect(teamStreak(wins, 'Rocky Gorge MD3')).toEqual({ code: 'W', count: 2 });
  });

  it('returns null without results and lists the last five newest first', () => {
    expect(teamStreak([], 'Rocky Gorge MD3')).toBeNull();
    expect(lastFive(fixtures, 'Rocky Gorge MD3')).toEqual(['L', 'W', 'W']);
  });
});

describe('winPct / formatPct / formatStreak', () => {
  it('counts draws as half a win, NFL style', () => {
    expect(winPct({ played: 4, won: 2, drawn: 1 })).toBe(0.625);
    expect(winPct({ played: 0, won: 0, drawn: 0 })).toBeNull();
  });

  it('formats percentages and streaks like a stat tracker', () => {
    expect(formatPct(0.625)).toBe('.625');
    expect(formatPct(1)).toBe('1.000');
    expect(formatPct(null)).toBe('–');
    expect(formatStreak({ code: 'W', count: 3 })).toBe('W3');
    expect(formatStreak(null)).toBe('–');
  });
});

describe('teamCrest / teamAbbreviation', () => {
  it('finds the first crest for a team', () => {
    const fixtures = [fixture('1', 'Rocky Gorge MD3', '20', 'NOVA MD3', '10')];
    expect(teamCrest(fixtures, 'NOVA MD3')).toBe('NOVA MD3-crest');
    expect(teamCrest(fixtures, 'Unknown')).toBe('');
  });

  it('skips the generic placeholder badge', () => {
    const fixtures = [
      {
        ...fixture('1', 'Rocky Gorge MD3', '20', 'NOVA MD3', '10'),
        homeTeam: {
          name: 'Rocky Gorge MD3',
          score: '20',
          crest:
            'https://d26phqdbpt0w91.cloudfront.net/NonVideo/d89f330c-59ec-44cb-b7c1-f23052bfa9ee.png',
        },
      },
    ];
    expect(teamCrest(fixtures, 'Rocky Gorge MD3')).toBe('');
  });

  it('builds short codes from team names', () => {
    expect(teamAbbreviation('Rocky Gorge MD3')).toBe('RGM');
    expect(teamAbbreviation('NOVA MD3')).toBe('NM');
  });
});

describe('seasonSummary', () => {
  const fixtures = [
    fixture('1', 'A', '49', 'B', '0'),
    fixture('2', 'C', '30', 'D', '28'),
  ];

  it('totals games, points, averages and shutouts', () => {
    const summary = seasonSummary(fixtures);
    expect(summary.games).toBe(2);
    expect(summary.totalPoints).toBe(107);
    expect(summary.avgPoints).toBeCloseTo(53.5);
    expect(summary.shutouts).toBe(1);
  });

  it('spots the biggest win and highest scoring game', () => {
    const summary = seasonSummary(fixtures);
    expect(summary.biggestWin).toMatchObject({ value: 49 });
    expect(summary.biggestWin?.fixture.id).toBe('1');
    expect(summary.highestScoring).toMatchObject({ value: 58 });
    expect(summary.highestScoring?.fixture.id).toBe('2');
  });

  it('handles an empty season', () => {
    expect(seasonSummary([])).toMatchObject({
      games: 0,
      totalPoints: 0,
      avgPoints: 0,
      biggestWin: null,
      highestScoring: null,
    });
  });
});

describe('longestWinStreak / activeStreaks', () => {
  const fixtures = [
    fixture('1', 'A', '20', 'B', '10', '2026-03-01T17:00:00+00:00'),
    fixture('2', 'A', '20', 'C', '10', '2026-03-08T17:00:00+00:00'),
    fixture('3', 'A', '20', 'D', '10', '2026-03-15T17:00:00+00:00'),
    fixture('4', 'E', '20', 'A', '10', '2026-03-22T17:00:00+00:00'),
  ];

  it('finds the best win run even after it ends', () => {
    expect(longestWinStreak(fixtures)).toEqual({ team: 'A', code: 'W', count: 3 });
  });

  it('ranks current streaks longest first', () => {
    const streaks = activeStreaks(fixtures, 5);
    expect(streaks[0]).toMatchObject({ team: 'A', code: 'L', count: 1 });
    expect(streaks).toHaveLength(5);
  });
});

describe('pointsLeaders / defenseLeaders', () => {
  const fixtures = [
    fixture('1', 'A', '50', 'B', '0'),
    fixture('2', 'C', '30', 'A', '20'),
  ];

  it('ranks teams by points scored', () => {
    expect(pointsLeaders(fixtures, 2).map((entry) => entry.team)).toEqual([
      'A',
      'C',
    ]);
  });

  it('ranks teams by fewest points conceded', () => {
    const leaders = defenseLeaders(fixtures, 4);
    expect(leaders[0]).toMatchObject({ team: 'C', value: 20 });
    expect(leaders.map((entry) => entry.team)).toEqual(['C', 'A', 'B']);
  });
});

describe('teamResults', () => {
  it('returns the team games newest first', () => {
    const fixtures = [
      fixture('1', 'A', '20', 'B', '10', '2026-03-01T17:00:00+00:00'),
      fixture('2', 'C', '20', 'B', '10', '2026-03-08T17:00:00+00:00'),
    ];
    expect(teamResults(fixtures, 'B').map((game) => game.id)).toEqual(['2', '1']);
  });
});
