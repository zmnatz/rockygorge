import fs from 'node:fs';
import path from 'node:path';
import { buildPlayerHistories } from '../src/utils/playerHistory';

// Best-effort like the other snapshots: /player falls back to building
// histories live, so a throttled CMS (HTTP 429) must never fail the build.
async function generate() {
  console.log('Building player histories for static export...');
  const outDir = path.join(process.cwd(), 'public', 'data');
  const outPath = path.join(outDir, 'players.json');
  try {
    const histories = await buildPlayerHistories({ concurrency: 3 });
    const plainObj = Object.fromEntries(histories);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(plainObj, null, 2));
    console.log(`Saved ${histories.size} player histories to public/data/players.json`);
  } catch (err) {
    console.warn(
      'Player histories unavailable, keeping previous snapshot:',
      (err as Error).message
    );
    if (!fs.existsSync(outPath)) {
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(outPath, JSON.stringify({}));
    }
  }
}

generate().catch((err) => {
  console.warn(
    'Failed to generate player histories, keeping previous snapshot:',
    (err as Error).message
  );
});
