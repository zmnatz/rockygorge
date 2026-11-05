import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  isForced,
  isFresh,
  isLocal,
  markChecked,
  markUpdated,
  readChecked,
  readManifest,
  SNAPSHOT_FORMATS,
  syncDir,
  type SnapshotManifest,
} from '../../scripts/lib/snapshot-freshness';

const HOUR = 60 * 60 * 1000;
const now = Date.parse('2026-11-05T12:00:00Z');
const stamp = (hoursAgo: number) => new Date(now - hoursAgo * HOUR).toISOString();
const manifest: SnapshotManifest = {
  scores: { updatedAt: stamp(100), format: SNAPSHOT_FORMATS.scores },
};
const base = { now, forced: false, local: false, manifest };

describe('isFresh (CI / Netlify)', () => {
  it('is fresh under a day since the last check', () => {
    expect(isFresh('scores', { ...base, checked: { scores: stamp(23) } })).toBe(true);
  });

  it('is stale at a day or older', () => {
    expect(isFresh('scores', { ...base, checked: { scores: stamp(24) } })).toBe(false);
  });

  it('is stale when never checked, malformed or in the future', () => {
    expect(isFresh('scores', { ...base, checked: {} })).toBe(false);
    expect(isFresh('scores', { ...base, checked: { scores: 'nope' } })).toBe(false);
    expect(isFresh('scores', { ...base, checked: { scores: stamp(-1) } })).toBe(false);
  });

  it('is never fresh when forced', () => {
    expect(isFresh('scores', { ...base, forced: true, checked: { scores: stamp(1) } })).toBe(false);
  });

  it('is stale when the committed format differs from the code', () => {
    const old: SnapshotManifest = { scores: { updatedAt: stamp(1), format: 0 } };
    expect(isFresh('scores', { ...base, manifest: old, checked: { scores: stamp(1) } })).toBe(false);
    expect(isFresh('scores', { ...base, manifest: {}, checked: { scores: stamp(1) } })).toBe(false);
  });
});

describe('isFresh (local)', () => {
  it('ignores age so local builds never dirty the tree', () => {
    expect(isFresh('scores', { ...base, local: true, checked: { scores: stamp(500) } })).toBe(true);
    expect(isFresh('scores', { ...base, local: true, checked: {} })).toBe(true);
  });

  it('still refreshes on a format change or when forced', () => {
    const old: SnapshotManifest = { scores: { updatedAt: stamp(1), format: 0 } };
    expect(isFresh('scores', { ...base, local: true, manifest: old })).toBe(false);
    expect(isFresh('scores', { ...base, local: true, forced: true })).toBe(false);
  });
});

describe('environment', () => {
  it('reads --force and FORCE_SNAPSHOTS', () => {
    expect(isForced(['bun', 'x.ts'], {})).toBe(false);
    expect(isForced(['bun', 'x.ts', '--force'], {})).toBe(true);
    expect(isForced([], { FORCE_SNAPSHOTS: '1' })).toBe(true);
    expect(isForced([], { FORCE_SNAPSHOTS: '0' })).toBe(false);
  });

  it('treats CI and Netlify as non-local', () => {
    expect(isLocal({})).toBe(true);
    expect(isLocal({ CI: 'true' })).toBe(false);
    expect(isLocal({ NETLIFY: 'true' })).toBe(false);
  });
});

describe('stamp files', () => {
  let dir: string;
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it('keeps checked and updated times separate and per snapshot', () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'snap-'));
    markChecked('scores', new Date('2026-11-05T01:00:00Z'), dir);
    markChecked('leaders', new Date('2026-11-05T02:00:00Z'), dir);
    markUpdated('scores', new Date('2026-11-04T01:00:00Z'), dir);
    expect(readChecked(dir)).toEqual({
      scores: '2026-11-05T01:00:00.000Z',
      leaders: '2026-11-05T02:00:00.000Z',
    });
    expect(readManifest(dir)).toEqual({
      scores: { updatedAt: '2026-11-04T01:00:00.000Z', format: SNAPSHOT_FORMATS.scores },
    });
  });
});

describe('syncDir', () => {
  let dir: string;
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it('reports no change when only generatedAt differs, and prunes extras', () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-'));
    const first = { 'index.json': JSON.stringify({ generatedAt: 'a', seasons: ['x'] }) };
    expect(syncDir(dir, first)).toBe(true);
    const later = { 'index.json': JSON.stringify({ generatedAt: 'b', seasons: ['x'] }) };
    expect(syncDir(dir, later)).toBe(false);
    expect(fs.readFileSync(path.join(dir, 'index.json'), 'utf-8')).toBe(first['index.json']);
    expect(syncDir(dir, { 'index.json': first['index.json'], 'old.json': '{}' })).toBe(true);
    expect(syncDir(dir, later)).toBe(true);
    expect(fs.existsSync(path.join(dir, 'old.json'))).toBe(false);
  });
});

// Guards a format bump: the committed snapshots must be regenerated with it.
describe('committed snapshots', () => {
  it('were generated with the current format versions', () => {
    const committed = readManifest(path.join(__dirname, '..', '..'));
    for (const [name, format] of Object.entries(SNAPSHOT_FORMATS)) {
      expect(
        committed[name as keyof SnapshotManifest]?.format,
        `${name} snapshot is stale: run \`bun run generate:force\` and commit the result`
      ).toBe(format);
    }
  });
});
