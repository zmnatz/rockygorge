import { describe, expect, it } from 'vitest';
import { clubsInRows, computeBreakdown, sameNamePlayers, sharedNames } from '@/utils/eligibility';
import type { PlayerRow, Side } from '@/types/eligibility';

const rules = { minimumMatches: 2, upperMatchLimit: 4, nonQualifyingCompetitions: [] };
const side = (level: number): Side => ({ teamName: `Club MD${level}`, label: `D${level}` });

const row = (teamName: string, played: number): PlayerRow => ({
  playerId: 'p',
  firstName: 'Pat',
  lastName: 'Lee',
  lastRegistered: '',
  teamName,
  competition: `${teamName} league`,
  appearances: played,
  played,
  substitute: 0,
  rounds: {},
});

/** The divisions a player's match counts make them eligible for. */
function eligibleFor(levels: number[], counts: number[]): string[] {
  const sides = levels.map(side);
  const rows = sides.map((item, index) => row(item.teamName, counts[index]));
  return computeBreakdown(rows, sides, rules)
    .sides.filter((item) => item.players[0].eligible)
    .map((item) => item.label);
}

// USA Club Rugby Senior Club Regulations 2026-27, Figure 1, every row in order.
describe('Figure 1: Sample Player NCS Eligibility Matrix', () => {
  it.each([
    [[1, 2], [4, 4], ['D1']],
    [[1, 2], [3, 3], ['D1', 'D2']],
    [[1, 2], [3, 2], ['D1']],
    [[1, 2], [1, 1], ['D1']],
    [[1, 2], [2, 3], ['D1', 'D2']],
    [[1, 2], [0, 2], ['D1', 'D2']],
    [[2, 3], [4, 4], ['D2']],
    [[2, 3], [3, 2], ['D2']],
    [[2, 3], [3, 4], ['D2', 'D3']],
    [[2, 3], [1, 1], ['D2']],
    [[2, 3], [2, 3], ['D2', 'D3']],
    [[2, 3], [0, 2], ['D2', 'D3']],
    [[1, 2, 3], [3, 1, 1], ['D1']],
    [[1, 2, 3], [4, 3, 2], ['D1']],
    [[1, 2, 3], [3, 4, 1], ['D1', 'D2']],
    [[1, 2, 3], [4, 1, 4], ['D1']],
    [[1, 2, 3], [2, 2, 2], ['D1', 'D2']],
    [[1, 2, 3], [1, 1, 4], ['D1', 'D2', 'D3']],
    [[1, 2, 3], [1, 1, 2], ['D1', 'D2', 'D3']],
    [[1, 2, 3], [0, 0, 2], ['D1', 'D2', 'D3']],
  ])('sides %j with matches %j are eligible for %j', (levels, counts, expected) => {
    expect(eligibleFor(levels, counts)).toEqual(expected);
  });
});

describe('a club with four sides, extending the three-division rule', () => {
  it('compares each side and those below it with every side above', () => {
    expect(eligibleFor([1, 2, 3, 4], [1, 1, 1, 3])).toEqual(['D1', 'D2', 'D3', 'D4']);
    expect(eligibleFor([1, 2, 3, 4], [2, 1, 1, 2])).toEqual(['D1', 'D2', 'D3']);
  });

  it('forfeits every side below one with a fourth match', () => {
    expect(eligibleFor([1, 2, 3, 4], [0, 4, 4, 4])).toEqual(['D1', 'D2']);
  });
});

describe('fixtures still to play with more than two sides', () => {
  const sides = [1, 2, 3].map(side);

  it('counts fixtures at or below a side towards its minimum, and no others', () => {
    const rows = sides.map((item, index) => row(item.teamName, index === 2 ? 1 : 0));
    const remaining = { 'Club MD1': 5, 'Club MD2': 0, 'Club MD3': 1 };
    const [top, middle, bottom] = computeBreakdown(rows, sides, rules, remaining).sides;

    expect(top.players[0]).toMatchObject({ eligible: true, pending: ['Needs 1 more qualifying match (6 fixtures left)'] });
    expect(middle.players[0]).toMatchObject({ eligible: true, pending: ['Needs 1 more D2 or lower match (1 fixture left)'] });
    expect(bottom.players[0]).toMatchObject({ eligible: true, pending: ['Needs 1 more D3 match (1 fixture left)'] });
  });
});

describe('clubsInRows', () => {
  it("finds a CSV report's club and sides from its team names, for any club", () => {
    const rows = ['Austin Blacks MD4', 'Austin Blacks MD1', 'Austin Blacks MD3', 'Austin Blacks MD2'].map((name) => row(name, 1));

    expect(clubsInRows(rows)).toEqual([
      {
        name: 'Austin Blacks',
        sides: [1, 2, 3, 4].map((level) => ({ teamName: `Austin Blacks MD${level}`, label: `D${level}` })),
      },
    ]);
  });

  it("keeps men's and women's sides as separate clubs, and skips unranked team names", () => {
    const rows = ['NOVA MD1', 'NOVA WD1', 'Selects'].map((name) => row(name, 1));

    expect(clubsInRows(rows).map((club) => club.name)).toEqual(['NOVA', 'NOVA Women']);
  });
});

describe('sharedNames', () => {
  const named = (name: string) => ({ name });

  it('finds names held by more than one player on a side, however they are written', () => {
    expect(sharedNames([named('Sean Dougherty'), named('sean  dougherty'), named('Sam Hooker')])).toEqual(
      new Set(['sean dougherty']),
    );
  });

  it('finds none when every name is different', () => {
    expect(sharedNames([named('Sean Dougherty'), named('Sam Hooker')])).toEqual(new Set());
  });
});

describe('sameNamePlayers', () => {
  const rowFor = (playerId: string, firstName: string, teamName: string): PlayerRow => ({
    ...row(teamName, 1),
    playerId,
    firstName,
    lastName: 'Dougherty',
  });

  it('lists each shared name once with its ids, across all of a club\'s sides', () => {
    const sides = [side(1), side(2)];
    const { sides: result } = computeBreakdown(
      [
        rowFor('b', 'Sean', 'Club MD1'),
        rowFor('a', 'Sean', 'Club MD1'),
        rowFor('a', 'Sean', 'Club MD2'),
        rowFor('c', 'Kim', 'Club MD2'),
      ],
      sides,
      rules,
    );

    expect(sameNamePlayers(result)).toEqual([{ name: 'Sean Dougherty', ids: ['a', 'b'] }]);
  });
});
