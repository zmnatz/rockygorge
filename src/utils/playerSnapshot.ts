import { type PlayerHistory, playerSnapshotFile } from '@/utils/playerHistory';
import { readPublishedJson } from '@/utils/publishedData';

// Reads a player's history for the player page's getStaticProps, which runs at request
// time in the route's function (ADR 016): from disk where the snapshots are, else from the
// deploy's own copy on the CDN (see readPublishedJson). Never import this from code that
// runs in the browser.

// Base CMS ids (`playerKey`) are letters and digits. Anything else has no snapshot, and
// isn't read as a path or a URL.
const PLAYER_ID = /^[A-Za-z0-9_-]+$/;

/** The player's history, or null when the id has no snapshot. `root` and `baseUrl` are for
 *  tests; `root` is the public/data directory. */
export async function readPlayerHistory(
  id: string,
  root?: string,
  baseUrl?: string
): Promise<PlayerHistory | null> {
  if (!PLAYER_ID.test(id)) return null;
  return readPublishedJson<PlayerHistory>(`players/${playerSnapshotFile(id)}`, root, baseUrl);
}
