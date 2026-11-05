import fs from 'node:fs';
import path from 'node:path';
import {
  buildPlayerHistories,
  PLAYERS_SNAPSHOT_DIR,
  playerSnapshotFile,
} from '../src/utils/playerHistory';
import { markUpdated, skipIfFresh } from './lib/snapshot-freshness';

// Best-effort like the other snapshots: a throttled CMS (HTTP 429) must never
// fail the build. On failure the previous snapshot is kept as-is.
async function generate() {
  console.log('Building player histories for static export...');
  const outDir = path.join(process.cwd(), 'public', PLAYERS_SNAPSHOT_DIR);
  const tmpDir = `${outDir}.tmp`;
  if (skipIfFresh('players', outDir)) {
    return;
  }
  try {
    const histories = await buildPlayerHistories({ concurrency: 3 });
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir, { recursive: true });
    for (const [id, history] of histories) {
      fs.writeFileSync(
        path.join(tmpDir, playerSnapshotFile(id)),
        JSON.stringify(history)
      );
    }
    // Swap in only once complete so a failed run never leaves a partial set.
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.renameSync(tmpDir, outDir);
    fs.rmSync(path.join(path.dirname(outDir), 'players.json'), { force: true });
    markUpdated('players');
    console.log(`Saved ${histories.size} player histories to public/${PLAYERS_SNAPSHOT_DIR}/`);
  } catch (err) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
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
