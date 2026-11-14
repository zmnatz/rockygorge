import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PLAYERS_SNAPSHOT_DIR, type PlayerHistory, playerSnapshotFile } from '@/utils/playerHistory';

// Reads a player's history from the committed snapshot on disk, for the player page's
// getStaticProps, which runs at request time in the route's function (ADR 016). Never
// import this from code that runs in the browser.

// Base CMS ids (`playerKey`) are letters and digits. Anything else has no snapshot, and
// isn't read as a path.
const PLAYER_ID = /^[A-Za-z0-9_-]+$/;

/** The player's history, or null when the id has no snapshot. */
export async function readPlayerHistory(
  id: string,
  // Not traced: next.config.ts lists the snapshots for the route, and tracing this call
  // would carry the whole project.
  dir = path.join(/* turbopackIgnore: true */ process.cwd(), 'public', PLAYERS_SNAPSHOT_DIR)
): Promise<PlayerHistory | null> {
  if (!PLAYER_ID.test(id)) return null;
  try {
    return JSON.parse(await readFile(path.join(dir, playerSnapshotFile(id)), 'utf8')) as PlayerHistory;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}
