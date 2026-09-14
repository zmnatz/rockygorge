import { describe, expect, it } from 'vitest';
import {
  aggregatePlayerHistory,
  isScoreEventType,
  playerKey,
} from '@/utils/playerHistory';

describe('playerKey', () => {
  it('strips the shirt-number suffix', () => {
    expect(playerKey('yJrSfLH8RmeSLDTu5__9')).toBe('yJrSfLH8RmeSLDTu5');
  });

  it('leaves ids without a suffix alone', () => {
    expect(playerKey('pH9Ae2CSzs5ebZYA3')).toBe('pH9Ae2CSzs5ebZYA3');
  });
});

describe('isScoreEventType', () => {
  it.each(['Try', 'Conversion', 'Penalty Goal', 'Field Goal'])(
    'treats %s as a scoring event',
    (type) => {
      expect(isScoreEventType(type)).toBe(true);
    }
  );

  it.each(['Substitution - Tactical', 'Substitution - Injury', 'Penalty'])(
    'does not treat %s as a scoring event',
    (type) => {
      expect(isScoreEventType(type)).toBe(false);
    }
  );
});

function fixture(id: string, homeScore: string, awayScore: string) {
  return {
    id,
    compId: 'comp1',
    compName: 'MAC Men D1',
    dateTime: '2026-04-18T17:00:00+00:00',
    season: '2025/2026',
    venue: 'TBA',
    homeTeam: {
      id: `${id}_home`,
      name: 'Rocky Gorge MD1',
      teamId: 'home',
      score: homeScore,
      crest: '',
    },
    awayTeam: {
      id: `${id}_away`,
      name: 'Opponents MD1',
      teamId: 'away',
      score: awayScore,
      crest: '',
    },
  };
}

describe('aggregatePlayerHistory', () => {
  it('records games, starter status and matching scoring events', () => {
    const histories = aggregatePlayerHistory([
      {
        fixture: fixture('game1', '15', '22'),
        commentary: [
          { id: 'c1', minute: '12', type: 'Try', comment: 'Try - Luc Desroches' },
          {
            id: 'c2',
            minute: '69',
            type: 'Substitution - Tactical',
            comment: 'Substitution - Tactical Off: Tyler Small, On: Joe Midwig',
          },
        ],
        players: [
          {
            id: 'luc-id__13',
            name: 'Luc Desroches',
            position: '13',
            shirtNumber: '13',
            isHome: true,
          },
        ],
        substitutes: [
          {
            id: 'joe-id__19',
            name: 'Joe Midwig',
            position: '19',
            shirtNumber: '19',
            isHome: false,
          },
        ],
        coaches: [],
      },
    ]);

    const luc = histories.get('luc-id');
    expect(luc?.name).toBe('Luc Desroches');
    expect(luc?.teamName).toBe('Rocky Gorge MD1');
    expect(luc?.games).toHaveLength(1);
    expect(luc?.games[0]).toMatchObject({
      fixtureId: 'game1',
      opponent: 'Opponents MD1',
      scoreFor: '15',
      scoreAgainst: '22',
      result: 'L',
      starter: true,
    });
    expect(luc?.scoringEvents).toHaveLength(1);
    expect(luc?.scoringEvents[0]).toMatchObject({
      minute: '12',
      type: 'Try',
    });

    // Substitution events are not scoring events, even when they name a player.
    const joe = histories.get('joe-id');
    expect(joe?.games[0].starter).toBe(false);
    expect(joe?.games[0].played).toBe(true);
    expect(joe?.scoringEvents).toHaveLength(0);
  });

  it('merges the same player across games sorted newest first', () => {
    const oldFixture = {
      ...fixture('old', '45', '21'),
      dateTime: '2026-04-11T17:00:00+00:00',
    };
    const histories = aggregatePlayerHistory([
      { fixture: oldFixture, commentary: [], players: [], substitutes: [], coaches: [] },
      {
        fixture: fixture('new', '15', '22'),
        commentary: [],
        players: [
          {
            id: 'luc-id__13',
            name: 'Luc Desroches',
            position: '13',
            shirtNumber: '13',
            isHome: true,
          },
        ],
        substitutes: [],
        coaches: [],
      },
    ]);

    // Only the new game lists Luc, but ordering is still newest-first.
    expect(histories.get('luc-id')?.games.map((game) => game.fixtureId)).toEqual([
      'new',
    ]);
  });
});
