import fs from 'node:fs';
import path from 'node:path';
import { fetchLiveScores } from '../src/api/scores';

// Snapshots are best-effort: the homepage falls back to live CMS data when
// the snapshot is missing or stale, so a throttled CMS (HTTP 429) must never
// fail the build. On failure the previous snapshot is kept as-is.
async function generate() {
  console.log('Building scores snapshot for static export...');
  const outDir = path.join(process.cwd(), 'public', 'data');
  const outPath = path.join(outDir, 'scores.json');
  try {
    const scores = await fetchLiveScores();
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(scores));
    console.log(`Saved ${scores.length} scores to public/data/scores.json`);
  } catch (err) {
    console.warn(
      'Live scores unavailable, keeping previous snapshot:',
      (err as Error).message
    );
    if (!fs.existsSync(outPath)) {
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(outPath, JSON.stringify([]));
    }
  }
}

generate().catch((err) => {
  console.warn(
    'Failed to generate scores snapshot, keeping previous snapshot:',
    (err as Error).message
  );
});
