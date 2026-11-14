import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { readPlayerHistory } from '@/utils/playerSnapshot';

const history = { id: 'abc', name: 'A Player', teamName: 'T', games: [], scoringEvents: [], eligibility: true };

describe('readPlayerHistory', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'players-'));
  writeFileSync(path.join(dir, 'abc.json'), JSON.stringify(history));
  writeFileSync(path.join(dir, 'broken.json'), '{');

  it("reads the player's snapshot", async () => {
    await expect(readPlayerHistory('abc', dir)).resolves.toEqual(history);
  });

  it('is null for an id with no snapshot', async () => {
    await expect(readPlayerHistory('nobody', dir)).resolves.toBeNull();
  });

  it("is null for an id that isn't a CMS id, without reading it as a path", async () => {
    writeFileSync(path.join(path.dirname(dir), 'outside.json'), JSON.stringify(history));
    await expect(readPlayerHistory('../outside', dir)).resolves.toBeNull();
    await expect(readPlayerHistory('', dir)).resolves.toBeNull();
  });

  it('throws on an unreadable snapshot', async () => {
    await expect(readPlayerHistory('broken', dir)).rejects.toThrow();
  });

  it('reads the committed snapshots by default', async () => {
    const found = await readPlayerHistory('f5JqeT4vzmH2nxtnR');
    expect(found?.name).toBe('Adam Wiley');
  });
});
