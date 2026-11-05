import fs from 'node:fs';
import path from 'node:path';
import { seasonSnapshotFile } from '../../src/api/capital';

// Replaces a snapshot directory with one file per season plus index.json.
// Call it only after a successful pull, so a throttled CMS leaves the
// previous snapshot untouched.
export function writeSeasonSnapshot(
  outDir: string,
  index: { seasons: string[] },
  seasons: { season: string }[]
): void {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  for (const season of seasons) {
    fs.writeFileSync(path.join(outDir, seasonSnapshotFile(season.season)), JSON.stringify(season));
  }
  fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index));
}
