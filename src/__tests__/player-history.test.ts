import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  aggregatePlayerHistory,
  fetchMatchCentres,
  fetchMatches,
  fetchMatchesInBatches,
  isNameWithheld,
  isScoreEventType,
  playerKey,
  playerPath,
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
  it('tidies stray spaces in a name, as the CMS sometimes has them', () => {
    const histories = aggregatePlayerHistory([
      {
        fixture: fixture('game1', '15', '22'),
        commentary: [],
        players: [{ id: 'chan__1', name: ' Chandler  Dodge ', position: '1', shirtNumber: '1', isHome: true }],
        substitutes: [],
        coaches: [],
      },
    ]);

    expect(histories.get('chan')?.name).toBe('Chandler Dodge');
  });

  it("takes a player's name and team from their latest match, whichever finished downloading first", () => {
    const match = (id: string, dateTime: string, name: string) => ({
      fixture: { ...fixture(id, '15', '22'), dateTime },
      commentary: [],
      players: [{ id: 'gabby__1', name, position: '1', shirtNumber: '1', isHome: true }],
      substitutes: [],
      coaches: [],
    });
    const older = match('old', '2026-09-01T17:00:00Z', 'Gabby Morris');
    const newer = match('new', '2026-10-01T17:00:00Z', 'Gabrielle Morris');

    expect(aggregatePlayerHistory([older, newer]).get('gabby')?.name).toBe('Gabrielle Morris');
    expect(aggregatePlayerHistory([newer, older]).get('gabby')?.name).toBe('Gabrielle Morris');
  });

  it('keeps no record for a hidden profile, in any spelling, as a lineup spot is not a person', () => {
    const histories = aggregatePlayerHistory([
      {
        fixture: fixture('game1', '15', '22'),
        commentary: [{ id: 'c1', minute: '12', type: 'Try', comment: 'Try - Name Withheld' }],
        players: [
          { id: 'hidden__1', name: 'Name Withheld', position: '1', shirtNumber: '1', isHome: true },
          { id: 'real__2', name: 'Sam Hooker', position: '2', shirtNumber: '2', isHome: true },
        ],
        substitutes: [{ id: 'also-hidden__16', name: ' name  withheld ', position: '16', shirtNumber: '16', isHome: true }],
        coaches: [],
      },
    ]);

    expect([...histories.keys()]).toEqual(['real']);
  });

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

describe('playerPath', () => {
  it("is the player's page, by their id", () => {
    expect(playerPath('f5JqeT4vzmH2nxtnR')).toBe('/player/f5JqeT4vzmH2nxtnR');
    expect(playerPath('a/b')).toBe('/player/a%2Fb');
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
      cameOn([sub('a', 'Sam Smith', true), sub('b', 'Sam Smith', true)], ['Sam Smith']),
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

describe('isNameWithheld', () => {
  it.each(['Name Withheld', 'name withheld', ' Name  Withheld '])('recognises %j', (name) => {
    expect(isNameWithheld(name)).toBe(true);
  });

  it('does not match a real name', () => {
    expect(isNameWithheld('Sam Withheld')).toBe(false);
  });
});

describe('fetching match centres in batches', () => {
  const fixtureFor = (id: string) => ({ id, compId: `comp-${id}`, season: '2026/2027', sourceType: '2' });
  const part = (id: string) => ({
    getFixtureItem: {
      id,
      compId: `comp-${id}`,
      compName: 'Capital Men D3',
      dateTime: '2026-10-10T17:00:00Z',
      season: '2026/2027',
      venue: '',
      homeTeam: { id: 'h', name: 'Club MD3', teamId: 'h', score: '10', crest: '' },
      awayTeam: { id: 'a', name: 'Other MD3', teamId: 'a', score: '5', crest: '' },
    },
    allMatchCommentary: [],
    allMatchStatsSummary: {
      lineUp: { players: [{ id: `${id}-p__1`, name: 'Sam Hooker', position: '1', shirtNumber: '1', isHome: true }], substitutes: [], coaches: [] },
    },
  });
  const respond = (body: unknown) => ({
    ok: true,
    status: 200,
    headers: new Headers(),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  });
  /** Answers a batched or single match query from its variables, as the CMS does. */
  const cms = (handle: (ids: string[]) => { data: Record<string, unknown> | null; errors?: unknown[] }) =>
    vi.fn(async (_url: string, init: RequestInit) => {
      const { variables, operationName } = JSON.parse(String(init.body));
      const ids = Object.values(variables).map((comp) => (comp as { fixture: string }).fixture);
      const body = handle(ids);
      if (operationName !== 'PlayerHistoryMatchCentreQuery' || !body.data) return respond(body);
      // A single query reads its fields without aliases.
      return respond({ data: { getFixtureItem: body.data.m0, allMatchCommentary: body.data.e0, allMatchStatsSummary: body.data.s0 } });
    });
  const aliased = (ids: string[], skip: string[] = []) => ({
    data: Object.fromEntries(
      ids.flatMap((id, index) => {
        const value = skip.includes(id) ? { getFixtureItem: null, allMatchCommentary: null, allMatchStatsSummary: null } : part(id);
        return [
          [`m${index}`, value.getFixtureItem],
          [`e${index}`, value.allMatchCommentary],
          [`s${index}`, value.allMatchStatsSummary],
        ];
      }),
    ),
  });

  afterEach(() => vi.unstubAllGlobals());

  it('asks for several matches in one request, and records a match with no details as null', async () => {
    const fetchMock = cms((ids) => aliased(ids, ['b']));
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchMatchCentres([fixtureFor('a'), fixtureFor('b')]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.get('a')?.players.map((player) => player.name)).toEqual(['Sam Hooker']);
    expect(result.get('a')?.fixture.season).toBe('2026/2027');
    expect(result.get('b')).toBeNull();
  });

  it('splits a long list into batches of the given size', async () => {
    const fetchMock = cms((ids) => aliased(ids));
    vi.stubGlobal('fetch', fetchMock);
    const fixtures = Array.from({ length: 25 }, (_, index) => fixtureFor(`f${index}`));

    const { matches, failed } = await fetchMatchesInBatches(fixtures, { batchSize: 10, gapMs: 0, retryDelayMs: 0 });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(matches).toHaveLength(25);
    expect(failed).toEqual([]);
  });

  it('falls back to one request per match when a batch is rejected, so only the bad match fails', async () => {
    vi.stubGlobal(
      'fetch',
      cms((ids) => (ids.includes('bad') ? { data: null, errors: [{ message: 'Unknown fixture' }] } : aliased(ids))),
    );

    const { matches, failed } = await fetchMatchesInBatches([fixtureFor('a'), fixtureFor('bad'), fixtureFor('c')], {
      gapMs: 0,
      retryDelayMs: 0,
    });

    expect(matches.map((match) => match.fixture.id).sort()).toEqual(['a', 'c']);
    expect(failed.map((fixture) => fixture.id)).toEqual(['bad']);
  });
});
