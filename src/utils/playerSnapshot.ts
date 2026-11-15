import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PLAYERS_SNAPSHOT_DIR, type PlayerHistory, playerSnapshotFile } from '@/utils/playerHistory';

// Reads a player's history for the player page's getStaticProps, which runs at request
// time in the route's function (ADR 016). Never import this from code that runs in the
// browser.
//
// The build, `next start` and `next dev` read the snapshots from public/data/players/,
// which `bun run build` calculates from the match archive. A deployed function doesn't
// carry them, so it reads the same file from its own deploy on the CDN, at the permalink
// the build recorded in PUBLISHED_DATA_URL (next.config.ts).

// Base CMS ids (`playerKey`) are letters and digits. Anything else has no snapshot, and
// isn't read as a path or a URL.
const PLAYER_ID = /^[A-Za-z0-9_-]+$/;

// Not traced: next.config.ts excludes the snapshots from every function, and tracing a
// path built at run time would carry the whole project.
const defaultDir = () => path.join(/* turbopackIgnore: true */ process.cwd(), 'public', PLAYERS_SNAPSHOT_DIR);

/** The player's history, or null when the id has no snapshot. `dir` and `baseUrl` are for
 *  tests: by default the disk is read when the snapshots are there, else the deploy's CDN. */
export async function readPlayerHistory(
  id: string,
  dir = defaultDir(),
  baseUrl = process.env.PUBLISHED_DATA_URL
): Promise<PlayerHistory | null> {
  if (!PLAYER_ID.test(id)) return null;
  if (!existsSync(dir) && baseUrl) {
    const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/players/${playerSnapshotFile(id)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Player snapshot ${id}: HTTP ${res.status}`);
    return (await res.json()) as PlayerHistory;
  }
  try {
    return JSON.parse(await readFile(path.join(dir, playerSnapshotFile(id)), 'utf8')) as PlayerHistory;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}
