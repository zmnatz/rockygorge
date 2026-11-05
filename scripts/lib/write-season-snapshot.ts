import { seasonSnapshotFile } from '../../src/api/capital';
import { syncDir } from './snapshot-freshness';

// Makes a snapshot directory hold one file per season plus index.json,
// rewriting only files whose content changed. Returns whether anything did.
// Call it only after a successful pull, so a throttled CMS leaves the
// previous snapshot untouched.
export function writeSeasonSnapshot(
  outDir: string,
  index: { seasons: string[] },
  seasons: { season: string }[]
): boolean {
  const files: Record<string, string> = {};
  for (const season of seasons) {
    files[seasonSnapshotFile(season.season)] = JSON.stringify(season);
  }
  files['index.json'] = JSON.stringify(index);
  return syncDir(outDir, files);
}
