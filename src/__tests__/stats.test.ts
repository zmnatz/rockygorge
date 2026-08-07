import { describe, it, expect } from 'vitest';
import { formatColumnTitle, getSortableName, aggregatePlayerStats } from '@/utils/stats';

describe('formatColumnTitle', () => {
  it('returns "Player" for "name" key', () => {
    expect(formatColumnTitle('name')).toBe('Player');
  });

  it('returns "Opponent" for "game" key', () => {
    expect(formatColumnTitle('game')).toBe('Opponent');
  });

  it('converts snake_case to Title Case', () => {
    expect(formatColumnTitle('tries_scored')).toBe('Tries Scored');
  });

  it('capitalizes single word', () => {
    expect(formatColumnTitle('tackles')).toBe('Tackles');
  });

  it('handles multi-word snake_case', () => {
    expect(formatColumnTitle('total_tackles_made')).toBe('Total Tackles Made');
  });
});

describe('getSortableName', () => {
  it('converts "First Last" to "Last, First"', () => {
    expect(getSortableName('John Smith')).toBe('smith, john');
  });

  it('handles single name', () => {
    expect(getSortableName('Cher')).toBe('cher, ');
  });

  it('trims whitespace', () => {
    expect(getSortableName('  John Smith  ')).toBe('smith, john');
  });

  it('handles middle names', () => {
    expect(getSortableName('John Michael Smith')).toBe('smith, john michael');
  });

  it('returns lowercase', () => {
    expect(getSortableName('JOHN SMITH')).toBe('smith, john');
  });
});

describe('aggregatePlayerStats', () => {
  it('aggregates stats for a single player across games', () => {
    const data = [
      { name: 'John Smith', tackles_made: 5, tries_scored: 1 },
      { name: 'John Smith', tackles_made: 3, tries_scored: 0 },
    ];
    const result = aggregatePlayerStats(data);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('John Smith');
    expect(result[0].tackles_made).toBe(8);
    expect(result[0].tries_scored).toBe(1);
    expect(result[0].key).toBe('agg-John Smith');
  });

  it('aggregates stats for multiple players', () => {
    const data = [
      { name: 'John Smith', tackles_made: 5 },
      { name: 'Jane Doe', tackles_made: 3 },
      { name: 'John Smith', tackles_made: 2 },
    ];
    const result = aggregatePlayerStats(data);

    expect(result).toHaveLength(2);
    const john = result.find((p) => p.name === 'John Smith');
    const jane = result.find((p) => p.name === 'Jane Doe');
    expect(john?.tackles_made).toBe(7);
    expect(jane?.tackles_made).toBe(3);
  });

  it('ignores "name", "game", and "key" fields from aggregation', () => {
    const data = [
      { name: 'John Smith', game: 'Game 1', key: '1', tackles_made: 5 },
      { name: 'John Smith', game: 'Game 2', key: '2', tackles_made: 3 },
    ];
    const result = aggregatePlayerStats(data);

    expect(result[0].tackles_made).toBe(8);
    expect(result[0].game).toBeUndefined();
    expect(result[0].key).toBe('agg-John Smith');
  });

  it('handles string numeric values', () => {
    const data = [
      { name: 'John Smith', tackles_made: '5' },
      { name: 'John Smith', tackles_made: '3' },
    ];
    const result = aggregatePlayerStats(data);

    expect(result[0].tackles_made).toBe(8);
  });

  it('preserves non-numeric string values', () => {
    const data = [
      { name: 'John Smith', position: 'Flanker' },
      { name: 'John Smith', position: 'Flanker' },
    ];
    const result = aggregatePlayerStats(data);

    expect(result[0].position).toBe('Flanker');
  });

  it('returns empty array for empty input', () => {
    expect(aggregatePlayerStats([])).toEqual([]);
  });
});
