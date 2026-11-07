import fs from 'node:fs';
import path from 'node:path';
import matchesConfig from '@config/matches.yml';
import { fetchLiveScores } from '../src/api/scores';
import type { GamedaySide } from '../src/types/gameday';
import { firstPaintKey } from '../src/utils/gameday';
import { recordRun, skipIfFresh, writeFileIfChanged } from './lib/snapshot-freshness';

// Read by nothing: it exists to make a commit, and so a build, when time alone
// changes what the static pages would show. See firstPaintKey.
const FIRST_PAINT_FILE = 'first-paint.json';

// Snapshots are best-effort: the homepage falls back to live CMS data when
// the snapshot is missing or stale, so a throttled CMS (HTTP 429) must never
// fail the build. On failure the previous snapshot is kept as-is.
async function generate() {
  console.log('Building scores snapshot for static export...');
  const outDir = path.join(process.cwd(), 'public', 'data');
  const outPath = path.join(outDir, 'scores.json');
  if (skipIfFresh('scores', outPath)) {
    return;
  }
  try {
    const scores = await fetchLiveScores();
    const firstPaint = JSON.stringify(firstPaintKey(scores, matchesConfig.sides as GamedaySide[]));
    const firstPaintChanged = writeFileIfChanged(path.join(outDir, FIRST_PAINT_FILE), firstPaint);
    recordRun('scores', writeFileIfChanged(outPath, JSON.stringify(scores)) || firstPaintChanged);
    console.log(`Saved ${scores.length} fixtures to public/data/scores.json`);
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
