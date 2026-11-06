import fs from 'node:fs';
import path from 'node:path';
import {
  buildPlayerHistories,
  PLAYERS_SNAPSHOT_DIR,
  playerSnapshotFile,
} from '../src/utils/playerHistory';
import {
  buildParticipationSnapshot,
  PARTICIPATION_SNAPSHOT_FILE,
} from '../src/utils/participation';
import { recordRun, skipIfFresh, syncDir } from './lib/snapshot-freshness';

// Best-effort like the other snapshots: a throttled CMS (HTTP 429) must never
// fail the build. On failure the previous snapshot is kept as-is.
async function generate() {
  const outDir = path.join(process.cwd(), 'public', PLAYERS_SNAPSHOT_DIR);
  if (skipIfFresh('players', outDir)) {
    return;
  }
  console.log('Building player histories for static export...');
  try {
    // Every history is built in memory first, so a failed pull never leaves
    // a partial set on disk.
    const { histories, results } = await buildPlayerHistories({ concurrency: 3 });
    const files: Record<string, string> = {};
    for (const [id, history] of histories) {
      files[playerSnapshotFile(id)] = JSON.stringify(history);
    }
    files[PARTICIPATION_SNAPSHOT_FILE] = JSON.stringify(
      buildParticipationSnapshot(histories.values(), results)
    );
    const changed = syncDir(outDir, files);
    fs.rmSync(path.join(path.dirname(outDir), 'players.json'), { force: true });
    recordRun('players', changed);
    console.log(`Saved ${histories.size} player histories to public/${PLAYERS_SNAPSHOT_DIR}/`);
  } catch (err) {
    console.warn(
      'Player histories unavailable, keeping previous snapshot:',
      (err as Error).message
    );
  }
}

generate().catch((err) => {
  console.warn(
    'Failed to generate player histories, keeping previous snapshot:',
    (err as Error).message
  );
});
