import fs from 'node:fs';
import path from 'node:path';
import { buildPlayerHistories, playerSnapshotFile } from '../src/utils/playerHistory';

// Best-effort like the other snapshots: /player falls back to building
// histories live, so a throttled CMS (HTTP 429) must never fail the build.
async function generate() {
  console.log('Building player histories for static export...');
  const dataDir = path.join(process.cwd(), 'public', 'data');
  const outDir = path.join(dataDir, 'players');
  const tmpDir = path.join(dataDir, 'players.tmp');
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
    fs.rmSync(path.join(dataDir, 'players.json'), { force: true });
    console.log(`Saved ${histories.size} player histories to public/data/players/`);
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
