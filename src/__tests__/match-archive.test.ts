import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  archivedMatches,
  matchesToFetch,
  readMatchArchive,
  updateArchive,
  writeMatchArchive,
  type MatchArchive,
} from '../../scripts/lib/match-archive';
import type { MatchCentreData } from '@/utils/playerHistory';

const CURRENT = '2026/2027';
const PAST = '2025/2026';

const fixture = (id: string, season: string) => ({ id, season });
const data = (id: string, season: string, name = 'Sam Hooker'): MatchCentreData => ({
  fixture: {
    id,
    compId: 'c',
    compName: 'Capital Men D3',
    season,
    dateTime: '2026-10-10T17:00:00Z',
    venue: '',
    homeTeam: { id: 'h', name: 'Club MD3', teamId: 'h', score: '10', crest: '' },
    awayTeam: { id: 'a', name: 'Other MD3', teamId: 'a', score: '5', crest: '' },
  },
  commentary: [],
  players: [{ id: 'sam__1', name, position: '1', shirtNumber: '1', isHome: true }],
  substitutes: [],
  coaches: [],
});

describe('matchesToFetch', () => {
  const archive: MatchArchive = { [PAST]: { kept: data('kept', PAST), empty: null }, [CURRENT]: { now: data('now', CURRENT) } };

  it('reads every current-season match, and only missing ones from locked seasons', () => {
    const fixtures = [fixture('kept', PAST), fixture('empty', PAST), fixture('missing', PAST), fixture('now', CURRENT)];

    expect(matchesToFetch(fixtures, archive, CURRENT).map((item) => item.id)).toEqual(['missing', 'now']);
  });

  it('reads everything for a full refresh', () => {
    expect(matchesToFetch([fixture('kept', PAST)], archive, '').map((item) => item.id)).toEqual(['kept']);
  });
});

describe('updateArchive', () => {
  it("keeps locked seasons, adds what was fetched, and replaces the current season's", () => {
    const archive: MatchArchive = { [PAST]: { kept: data('kept', PAST) }, [CURRENT]: { dropped: data('dropped', CURRENT) } };
    const fetched = new Map([
      ['missing', { season: PAST, match: null }],
      ['now', { season: CURRENT, match: data('now', CURRENT) }],
    ]);

    const next = updateArchive(archive, fetched, CURRENT);

    expect(Object.keys(next[PAST]).sort()).toEqual(['kept', 'missing']);
    expect(next[PAST].missing).toBeNull();
    expect(Object.keys(next[CURRENT])).toEqual(['now']);
  });
});

describe('archivedMatches', () => {
  it("gives the stored details for the schedule's fixtures, leaving out those with none", () => {
    const archive: MatchArchive = { [PAST]: { a: data('a', PAST), b: null, stale: data('stale', PAST) } };

    expect(archivedMatches(archive, [fixture('a', PAST), fixture('b', PAST)]).map((match) => match.fixture.id)).toEqual(['a']);
  });
});

describe('reading and writing the archive', () => {
  let dir = '';
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it('round-trips, one file per season, and rewrites only a season that changed', () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'archive-'));
    const archive: MatchArchive = { [PAST]: { b: data('b', PAST), a: data('a', PAST) }, [CURRENT]: { c: null } };

    expect(writeMatchArchive(dir, archive)).toBe(true);
    expect(readMatchArchive(dir)).toEqual(archive);
    expect(fs.readdirSync(dir).sort()).toEqual(['2025-2026.json', '2026-2027.json']);

    const pastFile = path.join(dir, '2025-2026.json');
    const before = fs.statSync(pastFile).mtimeMs;
    expect(writeMatchArchive(dir, { ...archive, [CURRENT]: { c: data('c', CURRENT) } })).toBe(true);
    expect(fs.statSync(pastFile).mtimeMs).toBe(before);
    expect(writeMatchArchive(dir, readMatchArchive(dir))).toBe(false);
  });

  it('reads a missing archive as empty', () => {
    dir = path.join(os.tmpdir(), 'no-archive-here');
    expect(readMatchArchive(dir)).toEqual({});
  });
});
