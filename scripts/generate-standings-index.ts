import fs from 'node:fs';
import path from 'node:path';
import {
  buildStandingsSnapshot,
  fetchLeagueFixtures,
  seasonSnapshotFile,
  splitStandingsSnapshot,
  type StandingsSnapshot,
  type StandingsSnapshotIndex,
} from '../src/api/capital';
import { CLUB_PAGES_FILE } from '../src/utils/rugbyXplorer';
import { logRequestStats } from './lib/log-request-stats';
import { readManifest, recordRun, SNAPSHOT_FORMATS, skipIfFresh } from './lib/snapshot-freshness';
import { writeSeasonSnapshot } from './lib/write-season-snapshot';

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

// The saved seasons, and the season to read again from: the latest one, so a
// finished season gets one last read as the next begins. Past seasons don't
// change, so they're only read again for a format change or --full-history.
function savedSeasons(
  dir: string
): { saved: Pick<StandingsSnapshot, 'fixtures' | 'ladders'>; refreshFrom: string } | null {
  if (
    process.argv.includes('--full-history') ||
    readManifest().standings?.format !== SNAPSHOT_FORMATS.standings ||
    !fs.existsSync(path.join(dir, 'index.json'))
  ) {
    return null;
  }
  const index = readJson<StandingsSnapshotIndex>(path.join(dir, 'index.json'));
  const seasons = index.seasons.map((season) =>
    readJson<Pick<StandingsSnapshot, 'fixtures' | 'ladders'>>(path.join(dir, seasonSnapshotFile(season)))
  );
  return {
    saved: {
      fixtures: seasons.flatMap((season) => season.fixtures),
      ladders: Object.assign({}, ...seasons.map((season) => season.ladders)),
    },
    refreshFrom: index.defaultSeason,
  };
}

function savedClubCrests(): Record<string, { crest: string | null }> {
  const file = path.join(process.cwd(), 'public', 'data', CLUB_PAGES_FILE);
  return fs.existsSync(file) ? readJson<{ clubs: Record<string, { crest: string | null }> }>(file).clubs : {};
}

// Best-effort like the other snapshots: /standings falls back to live CMS
// data when the snapshot is missing, so a throttled CMS (HTTP 429) must
// never fail the build. On failure the previous snapshot is kept as-is.
async function generate() {
  console.log('Building standings snapshot for static export...');
  // Split by season so /standings downloads only the seasons it shows.
  const outDir = path.join(process.cwd(), 'public', 'data', 'standings');
  if (skipIfFresh('standings', path.join(outDir, 'index.json'))) {
    return;
  }
  try {
    const previous = savedSeasons(outDir);
    const refreshFrom = previous?.refreshFrom ?? '';
    const snapshot = await buildStandingsSnapshot({
      gapMs: 300,
      fetchFixtures: () => fetchLeagueFixtures(savedClubCrests(), refreshFrom),
      saved: previous?.saved,
      refreshFrom,
    });
    const { index, seasons } = splitStandingsSnapshot(snapshot);
    recordRun('standings', writeSeasonSnapshot(outDir, index, Object.values(seasons)));
    console.log(
      `Saved ${snapshot.fixtures.length} fixtures and ${Object.keys(snapshot.ladders).length} ladders across ${index.seasons.length} seasons to public/data/standings/`
    );
    logRequestStats('standings');
  } catch (err) {
    // Fails the nightly run, so GitHub reports it; the previous snapshot stays.
    process.exitCode = 1;
    console.warn(
      'Standings unavailable, keeping previous snapshot:',
      (err as Error).message
    );
  }
}

generate().catch((err) => {
  // Fails the nightly run, so GitHub reports it; the previous snapshot stays.
  process.exitCode = 1;
  console.warn(
    'Failed to generate standings snapshot, keeping previous snapshot:',
    (err as Error).message
  );
});
