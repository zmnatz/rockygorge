import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  aggregatePlayerHistory,
  fetchMatches,
  isScoreEventType,
  loadPlayerHistory,
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

  it.each([
    'Substitution - Tactical',
    'Substitution - Injury',
    'Penalty',
    'Conversion Unsuccessful',
    'Penalty Goal Unsuccessful',
  ])(
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

  it("records each game against the player's own side, including a side change", () => {
    const player = (isHome: boolean) => ({
      id: 'sam-id__10',
      name: 'Sam Hooker',
      position: '10',
      shirtNumber: '10',
      isHome,
    });
    const histories = aggregatePlayerHistory([
      {
        fixture: {
          ...fixture('upper', '10', '5'),
          dateTime: '2026-10-02T17:00:00+00:00',
        },
        commentary: [],
        players: [player(true)],
        substitutes: [],
        coaches: [],
      },
      {
        fixture: {
          ...fixture('lower', '10', '5'),
          dateTime: '2026-10-01T17:00:00+00:00',
          awayTeam: { ...fixture('lower', '10', '5').awayTeam, name: 'Rocky Gorge MD3' },
        },
        commentary: [],
        players: [player(false)],
        substitutes: [],
        coaches: [],
      },
    ]);

    expect(histories.get('sam-id')?.games.map((game) => game.teamName)).toEqual([
      'Rocky Gorge MD1',
      'Rocky Gorge MD3',
    ]);
  });

  it('does not count a coach as having played', () => {
    const histories = aggregatePlayerHistory([
      {
        fixture: fixture('game1', '15', '22'),
        commentary: [],
        players: [],
        substitutes: [],
        coaches: [
          { id: 'coach-id', name: 'Pat Coach', position: 'Coach', shirtNumber: '', isHome: true },
        ],
      },
    ]);

    expect(histories.get('coach-id')?.games[0]).toMatchObject({
      coach: true,
      starter: false,
      played: false,
    });
  });

  it('records one game for a player-coach, as the player', () => {
    const histories = aggregatePlayerHistory([
      {
        fixture: fixture('game1', '15', '22'),
        commentary: [],
        players: [
          { id: 'pat-id__8', name: 'Pat Coach', position: '8', shirtNumber: '8', isHome: true },
        ],
        substitutes: [],
        coaches: [
          { id: 'pat-id', name: 'Pat Coach', position: 'Coach', shirtNumber: '', isHome: true },
        ],
      },
    ]);

    expect(histories.get('pat-id')?.games).toHaveLength(1);
    expect(histories.get('pat-id')?.games[0]).toMatchObject({
      coach: false,
      starter: true,
      played: true,
    });
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

describe('loadPlayerHistory', () => {
  const history = { id: 'abc', name: 'A Player', teamName: 'T', games: [], scoringEvents: [] };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetch(response: Response) {
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  it('fetches the per-player snapshot file', async () => {
    const fetchMock = stubFetch(Response.json(history));
    await expect(loadPlayerHistory('abc')).resolves.toEqual(history);
    expect(fetchMock).toHaveBeenCalledWith('/data/players/abc.json');
  });

  it('treats a 404 as an unknown player', async () => {
    stubFetch(new Response('', { status: 404 }));
    await expect(loadPlayerHistory('abc')).resolves.toBeNull();
  });

  it('treats the catch-all HTML rewrite (200) as an unknown player', async () => {
    stubFetch(new Response('<html></html>', { headers: { 'content-type': 'text/html' } }));
    await expect(loadPlayerHistory('abc')).resolves.toBeNull();
  });

  it('throws on other failures', async () => {
    stubFetch(new Response('', { status: 500 }));
    await expect(loadPlayerHistory('abc')).rejects.toThrow();
  });
});

describe('aggregatePlayerHistory substitute matching', () => {
  const sub = (id: string, name: string, isHome: boolean) => ({
    id: `${id}__17`,
    name,
    position: '17',
    shirtNumber: '17',
    isHome,
  });
  const on = (name: string) => ({
    id: name,
    minute: '50',
    type: 'Substitution - Tactical',
    comment: `Substitution - Tactical Off: Someone Else, On: ${name}`,
  });
  const cameOn = (substitutes: ReturnType<typeof sub>[], names: string[]) => {
    const histories = aggregatePlayerHistory([
      {
        fixture: fixture('game1', '15', '22'),
        commentary: names.map(on),
        players: [],
        substitutes,
        coaches: [],
      },
    ]);
    return substitutes.map((player) => histories.get(player.id.split('__')[0])?.games[0].played);
  };

  it('does not credit a substitute who only shares a surname with one who came on', () => {
    expect(
      cameOn([sub('kyle', 'Kyle Henry', true), sub('sidney', 'Sidney Henry', false)], ['Kyle Henry']),
    ).toEqual([true, false]);
  });

  it('does not use a surname fallback once another substitute with that surname is accounted for', () => {
    expect(
      cameOn([sub('kyle', 'Kyle Henry', true), sub('sidney', 'Sidney Henry', false)], ['Kyle Henry', 'K Henry']),
    ).toEqual([true, false]);
  });

  it("uses the player coming off to keep an event to that player's side", () => {
    const histories = aggregatePlayerHistory([
      {
        fixture: fixture('game1', '15', '22'),
        commentary: [
          {
            id: 'c1',
            minute: '50',
            type: 'Substitution - Tactical',
            comment: 'Substitution - Tactical Off: Home Starter, On: Tom Henry',
          },
          {
            id: 'c2',
            minute: '55',
            type: 'Substitution - Tactical',
            comment: 'Substitution - Tactical Off: Away Starter, On: Sam Smith',
          },
        ],
        players: [
          { id: 'hs__1', name: 'Home Starter', position: '1', shirtNumber: '1', isHome: true },
          { id: 'as__1', name: 'Away Starter', position: '1', shirtNumber: '1', isHome: false },
        ],
        substitutes: [
          sub('sidney', 'Sidney Henry', false),
          sub('home-sam', 'Sam Smith', true),
          sub('away-sam', 'Sam Smith', false),
        ],
        coaches: [],
      },
    ]);

    expect(histories.get('sidney')?.games[0].played).toBe(false);
    expect(histories.get('home-sam')?.games[0].played).toBe(false);
    expect(histories.get('away-sam')?.games[0].played).toBe(true);
  });

  it('credits one substitute for each event when several share a name', () => {
    expect(
      cameOn([sub('a', 'Name Withheld', true), sub('b', 'Name Withheld', true)], ['Name Withheld']),
    ).toEqual([true, false]);
  });

  it('accepts a differently spelled first name when the surname points at one substitute', () => {
    expect(cameOn([sub('joe', 'Joseph Midwig', true)], ['Joe Midwig'])).toEqual([true]);
  });

  it('credits nobody when a differently spelled name could be either of two substitutes', () => {
    expect(
      cameOn([sub('kyle', 'Kyle Henry', true), sub('sidney', 'Sidney Henry', false)], ['K Henry']),
    ).toEqual([false, false]);
  });
});

describe('fetchMatches', () => {
  const noWait = { gapMs: 0, retryDelayMs: 0 };

  it('retries a failed fixture and returns it once it succeeds', async () => {
    let calls = 0;
    const result = await fetchMatches(
      ['a'],
      async (id) => {
        calls += 1;
        if (calls === 1) throw new Error('Request failed: 429');
        return `match-${id}`;
      },
      noWait,
    );

    expect(result).toEqual({ matches: ['match-a'], failed: [] });
  });

  it('reports fixtures that keep failing', async () => {
    const result = await fetchMatches(
      ['good', 'bad'],
      async (id) => {
        if (id === 'bad') throw new Error('Request failed: 429');
        return id;
      },
      noWait,
    );

    expect(result).toEqual({ matches: ['good'], failed: ['bad'] });
  });

  it('can stop at the first failure without retrying', async () => {
    const fetched: string[] = [];
    const result = await fetchMatches(
      ['bad', 'later'],
      async (id) => {
        fetched.push(id);
        throw new Error('Request failed: 429');
      },
      { ...noWait, stopOnFailure: true },
    );

    expect(fetched).toEqual(['bad']);
    expect(result.failed).toEqual(['bad']);
  });

  it('treats a fixture with no data as answered, not failed', async () => {
    const fetched: string[] = [];
    const result = await fetchMatches(
      ['empty'],
      async (id) => {
        fetched.push(id);
        return null;
      },
      noWait,
    );

    expect(result).toEqual({ matches: [], failed: [] });
    expect(fetched).toEqual(['empty']);
  });
});
