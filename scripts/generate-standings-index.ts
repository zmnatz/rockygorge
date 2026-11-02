import fs from 'node:fs';
import path from 'node:path';
import {
  buildStandingsSnapshot,
  seasonSnapshotFile,
  splitStandingsSnapshot,
} from '../src/api/capital';

// Best-effort like the other snapshots: /standings falls back to live CMS
// data when the snapshot is missing, so a throttled CMS (HTTP 429) must
// never fail the build. On failure the previous snapshot is kept as-is.
async function generate() {
  console.log('Building standings snapshot for static export...');
  // Split by season so /standings downloads only the seasons it shows.
  const outDir = path.join(process.cwd(), 'public', 'data', 'standings');
  try {
    const snapshot = await buildStandingsSnapshot({ gapMs: 300 });
    const { index, seasons } = splitStandingsSnapshot(snapshot);
    // Written fresh only after a successful pull, so a throttled CMS leaves
    // the previous snapshot untouched.
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.mkdirSync(outDir, { recursive: true });
    for (const season of Object.values(seasons)) {
      fs.writeFileSync(path.join(outDir, seasonSnapshotFile(season.season)), JSON.stringify(season));
    }
    fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index));
    console.log(
      `Saved ${snapshot.fixtures.length} fixtures and ${Object.keys(snapshot.ladders).length} ladders across ${index.seasons.length} seasons to public/data/standings/`
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
