import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readPlayerHistory } from '@/utils/playerSnapshot';

const history = { id: 'abc', name: 'A Player', teamName: 'T', games: [], scoringEvents: [] };

describe('readPlayerHistory', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'data-'));
  const dir = path.join(root, 'players');
  mkdirSync(dir);
  writeFileSync(path.join(dir, 'abc.json'), JSON.stringify(history));
  writeFileSync(path.join(dir, 'broken.json'), '{');

  it("reads the player's snapshot", async () => {
    await expect(readPlayerHistory('abc', root)).resolves.toEqual(history);
  });

  it('is null for an id with no snapshot', async () => {
    await expect(readPlayerHistory('nobody', root)).resolves.toBeNull();
  });

  it("is null for an id that isn't a CMS id, without reading it as a path", async () => {
    writeFileSync(path.join(path.dirname(root), 'outside.json'), JSON.stringify(history));
    await expect(readPlayerHistory('../outside', root)).resolves.toBeNull();
    await expect(readPlayerHistory('', root)).resolves.toBeNull();
  });

  it('throws on an unreadable snapshot', async () => {
    await expect(readPlayerHistory('broken', root)).rejects.toThrow();
  });

  afterEach(() => vi.unstubAllGlobals());

  it("reads the deploy's copy over HTTP when the snapshots aren't on disk", async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.endsWith('/players/abc.json') ? Response.json(history) : new Response('', { status: 404 })
    );
    vi.stubGlobal('fetch', fetchMock);
    const missing = path.join(root, 'missing');
    await expect(readPlayerHistory('abc', missing, 'https://deploy.example/data/')).resolves.toEqual(history);
    expect(fetchMock).toHaveBeenCalledWith('https://deploy.example/data/players/abc.json');
    await expect(readPlayerHistory('nobody', missing, 'https://deploy.example/data')).resolves.toBeNull();
  });

  it('throws when the CDN fails', async () => {
    vi.stubGlobal('fetch', async () => new Response('', { status: 500 }));
    await expect(readPlayerHistory('abc', path.join(root, 'missing'), 'https://deploy.example/data')).rejects.toThrow();
  });
});
