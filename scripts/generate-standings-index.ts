import fs from 'node:fs';
import path from 'node:path';
import { buildStandingsSnapshot } from '../src/api/capital';

// Best-effort like the other snapshots: /standings falls back to live CMS
// data when the snapshot is missing, so a throttled CMS (HTTP 429) must
// never fail the build. On failure the previous snapshot is kept as-is.
async function generate() {
  console.log('Building standings snapshot for static export...');
  const outDir = path.join(process.cwd(), 'public', 'data');
  const outPath = path.join(outDir, 'standings.json');
  try {
    const snapshot = await buildStandingsSnapshot({ gapMs: 300 });
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(snapshot));
    console.log(
      `Saved ${snapshot.fixtures.length} fixtures and ${Object.keys(snapshot.ladders).length} ladders to public/data/standings.json`
    );
  } catch (err) {
    console.warn(
      'Standings unavailable, keeping previous snapshot:',
      (err as Error).message
    );
  }
}

generate().catch((err) => {
  console.warn(
    'Failed to generate standings snapshot, keeping previous snapshot:',
    (err as Error).message
  );
});
