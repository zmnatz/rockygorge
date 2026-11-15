import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  isForced,
  isFresh,
  markUpdated,
  readManifest,
  SNAPSHOT_FORMATS,
  syncDir,
  type SnapshotManifest,
} from '../../scripts/lib/snapshot-freshness';

const manifest: SnapshotManifest = {
  scores: { updatedAt: '2026-11-01T00:00:00.000Z', format: SNAPSHOT_FORMATS.scores },
};

describe('isFresh', () => {
  it('is fresh while the committed format is current', () => {
    expect(isFresh('scores', { forced: false, manifest })).toBe(true);
  });

  it('is never fresh when forced', () => {
    expect(isFresh('scores', { forced: true, manifest })).toBe(false);
  });

  it('is stale when the committed format differs from the code, or is missing', () => {
    const old: SnapshotManifest = { scores: { updatedAt: '2026-11-01T00:00:00.000Z', format: 0 } };
    expect(isFresh('scores', { forced: false, manifest: old })).toBe(false);
    expect(isFresh('scores', { forced: false, manifest: {} })).toBe(false);
  });
});

describe('environment', () => {
  it('reads --force and FORCE_SNAPSHOTS', () => {
    expect(isForced(['bun', 'x.ts'], {})).toBe(false);
    expect(isForced(['bun', 'x.ts', '--force'], {})).toBe(true);
    expect(isForced([], { FORCE_SNAPSHOTS: '1' })).toBe(true);
    expect(isForced([], { FORCE_SNAPSHOTS: '0' })).toBe(false);
  });
});

describe('manifest', () => {
  let dir: string;
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it('records each snapshot separately, with the format it was generated with', () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'snap-'));
    markUpdated('scores', new Date('2026-11-04T01:00:00Z'), dir);
    markUpdated('crests', new Date('2026-11-05T02:00:00Z'), dir);
    expect(readManifest(dir)).toEqual({
      scores: { updatedAt: '2026-11-04T01:00:00.000Z', format: SNAPSHOT_FORMATS.scores },
      crests: { updatedAt: '2026-11-05T02:00:00.000Z', format: SNAPSHOT_FORMATS.crests },
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
