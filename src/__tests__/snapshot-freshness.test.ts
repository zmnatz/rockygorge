import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  isForced,
  isFresh,
  markUpdated,
  readManifest,
} from '../../scripts/lib/snapshot-freshness';

const HOUR = 60 * 60 * 1000;
const now = Date.parse('2026-11-05T12:00:00Z');
const stamp = (hoursAgo: number) => new Date(now - hoursAgo * HOUR).toISOString();

describe('isFresh', () => {
  it('is fresh under a day old', () => {
    expect(isFresh('scores', { now, forced: false, manifest: { scores: stamp(23) } })).toBe(true);
  });

  it('is stale at a day or older', () => {
    expect(isFresh('scores', { now, forced: false, manifest: { scores: stamp(24) } })).toBe(false);
  });

  it('is stale when missing, malformed or in the future', () => {
    expect(isFresh('scores', { now, forced: false, manifest: {} })).toBe(false);
    expect(isFresh('scores', { now, forced: false, manifest: { scores: 'nope' } })).toBe(false);
    expect(isFresh('scores', { now, forced: false, manifest: { scores: stamp(-1) } })).toBe(false);
  });

  it('is never fresh when forced', () => {
    expect(isFresh('scores', { now, forced: true, manifest: { scores: stamp(1) } })).toBe(false);
  });
});

describe('isForced', () => {
  it('reads --force and FORCE_SNAPSHOTS', () => {
    expect(isForced(['bun', 'x.ts'], {})).toBe(false);
    expect(isForced(['bun', 'x.ts', '--force'], {})).toBe(true);
    expect(isForced([], { FORCE_SNAPSHOTS: '1' })).toBe(true);
    expect(isForced([], { FORCE_SNAPSHOTS: '0' })).toBe(false);
  });
});

describe('markUpdated', () => {
  let dir: string;
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it('records per-snapshot timestamps without clobbering others', () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'snap-'));
    markUpdated('scores', new Date('2026-11-05T01:00:00Z'), dir);
    markUpdated('leaders', new Date('2026-11-05T02:00:00Z'), dir);
    expect(readManifest(dir)).toEqual({
      scores: '2026-11-05T01:00:00.000Z',
      leaders: '2026-11-05T02:00:00.000Z',
    });
  });
});
