import { describe, expect, it } from 'vitest';
import type { PlayerLine } from '@/utils/leaders';
import { coverageNote, playersOfTeams, sortPlayers } from '@/utils/leadersView';

function player(overrides: Partial<PlayerLine>): PlayerLine {
  return {
    playerId: 'a',
    name: 'A',
    team: 'T',
    tries: 0,
    conversions: 0,
    penaltyGoals: 0,
    dropGoals: 0,
    points: 0,
    games: 0,
    ...overrides,
  };
}

describe('sortPlayers', () => {
  const players = [
    player({ name: 'Kicker', points: 40, tries: 0, conversions: 20 }),
    player({ name: 'Winger', points: 25, tries: 5 }),
    player({ name: 'Centre', points: 25, tries: 3 }),
  ];

  it('ranks by points then tries by default, without mutating the input', () => {
    const sorted = sortPlayers(players, 'points');
    expect(sorted.map((p) => p.name)).toEqual(['Kicker', 'Winger', 'Centre']);
    expect(players[0].name).toBe('Kicker');
  });

  it('ranks by tries first when asked, falling back to points', () => {
    expect(sortPlayers(players, 'tries').map((p) => p.name)).toEqual([
      'Winger',
      'Centre',
      'Kicker',
    ]);
  });

  it('ranks by conversions made', () => {
    expect(sortPlayers(players, 'conversions')[0].name).toBe('Kicker');
  });
});

describe('coverageNote', () => {
  it('states games with scoring logged and unattributed scores', () => {
    expect(coverageNote({ games: 58, gamesWithScoring: 50, unattributed: 12 })).toBe(
      'Based on 50 of 58 games with scoring logged; 12 scores unattributed.'
    );
  });

  it('uses singular for one score', () => {
    expect(coverageNote({ games: 1, gamesWithScoring: 1, unattributed: 1 })).toContain(
      '1 score unattributed'
    );
  });
});

describe('playersOfTeams', () => {
  const players = [player({ name: 'A', team: 'X' }), player({ name: 'B', team: 'Y' })];

  it('keeps everyone for All and narrows to the selected team names', () => {
    expect(playersOfTeams(players, ['All'])).toHaveLength(2);
    expect(playersOfTeams(players, ['Y']).map((p) => p.name)).toEqual(['B']);
    expect(playersOfTeams(players, ['Z'])).toEqual([]);
  });
});
