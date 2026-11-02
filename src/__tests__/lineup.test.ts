import { describe, expect, it } from 'vitest';
import { finishersOf, parseRosterText, SAMPLE_ROSTER_TEXT, startersOf } from '@/utils/lineup';

describe('parseRosterText', () => {
  it('parses the sample graphic (name-first starters, number-first backs, dashed finishers)', () => {
    const { players, errors } = parseRosterText(SAMPLE_ROSTER_TEXT);
    expect(errors).toEqual([]);
    expect(players).toHaveLength(23);
    expect(players[0]).toMatchObject({ number: 1, name: 'BART VERMULEN' });
    expect(players.find((p) => p.number === 8)).toMatchObject({
      number: 8,
      captain: true,
    });
    expect(players.find((p) => p.number === 9)).toMatchObject({
      name: 'BRANDON DRUMMOND',
    });
    expect(startersOf(players)).toHaveLength(15);
    expect(finishersOf(players)).toHaveLength(8);
  });

  it('parses number-first lines and (C) in either position', () => {
    const { players, errors } = parseRosterText('1 Bart Vermulen\n8 (C) Adam Wiley\n(C) 7 James Nutland');
    expect(errors).toEqual(
      expect.arrayContaining([expect.stringMatching(/Missing starter/)])
    );
    expect(players).toHaveLength(3);
    expect(players.find((p) => p.number === 8)?.captain).toBe(true);
    expect(players.find((p) => p.number === 7)?.captain).toBe(true);
  });

  it('reports unparseable lines and duplicates', () => {
    const { players, errors } = parseRosterText('1 Bart Vermulen\n1 Tristan Cole\nhello world');
    expect(players).toHaveLength(1);
    expect(errors.join('\n')).toMatch(/Duplicate number 1/);
    expect(errors.join('\n')).toMatch(/could not parse/);
  });

  it('reports missing starter numbers', () => {
    const { errors } = parseRosterText('1 Bart Vermulen\n2 Tristan Cole');
    expect(errors.join('\n')).toMatch(/Missing starter numbers/);
  });
});
