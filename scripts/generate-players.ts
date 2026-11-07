import fs from 'node:fs';
import path from 'node:path';
import { seasonSnapshotFile } from '../src/api/capital';
import {
  aggregatePlayerHistory,
  buildPlayerHistories,
  fetchMatchCentre,
  fetchMatches,
  mergeSavedHistories,
  type PlayerHistory,
  PLAYERS_SNAPSHOT_DIR,
  playerSnapshotFile,
} from '../src/utils/playerHistory';
import {
  buildParticipationSnapshot,
  PARTICIPATION_SNAPSHOT_FILE,
  scheduledResults,
  type ScheduledFixture,
} from '../src/utils/participation';
import {
  readManifest,
  recordRun,
  SNAPSHOT_FORMATS,
  skipIfFresh,
  syncDir,
} from './lib/snapshot-freshness';

// The current season's fixtures for every side, from the standings snapshot
// (generated before this one). Throws if it's missing, which keeps the previous
// snapshot rather than dropping those sides.
function currentSeasonSchedule(): ScheduledFixture[] {
  const dir = path.join(process.cwd(), 'public', 'data', 'standings');
  const read = (file: string) => JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
  return read(seasonSnapshotFile(read('index.json').defaultSeason)).fixtures;
}

function readSavedHistories(dir: string): PlayerHistory[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir)
    .filter((name) => name !== PARTICIPATION_SNAPSHOT_FILE)
    .map((name) => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf-8')));
}

// Best-effort like the other snapshots: a throttled CMS (HTTP 429) must never
// fail the build. On failure the previous snapshot is kept as-is.
async function generate() {
  const outDir = path.join(process.cwd(), 'public', PLAYERS_SNAPSHOT_DIR);
  if (skipIfFresh('players', outDir)) {
    return;
  }
  console.log('Building player histories for static export...');
  try {
    // Every history is built in memory first, so a failed pull never leaves
    // a partial set on disk.
    const schedule = currentSeasonSchedule();
    // Only the current season is pulled; past seasons come from the saved files.
    // Saved files in an older format can't be reused, and --full-history forces
    // a complete pull to pick up corrections to past seasons.
    const saved = readSavedHistories(outDir);
    const fullHistory =
      process.argv.includes('--full-history') ||
      saved.length === 0 ||
      readManifest().players?.format !== SNAPSHOT_FORMATS.players;
    const { histories: pulled, results, matches, season } = await buildPlayerHistories({
      concurrency: 3,
      fullHistory,
    });
    const histories = fullHistory ? pulled : mergeSavedHistories(saved, pulled, season);
    console.log(`Fetched ${matches.length} matches (${fullHistory ? 'all seasons' : season}).`);
    // Sides outside the club feed only need participation, not player files.
    const otherResults = scheduledResults(results, schedule);
    const other = await fetchMatches(
      otherResults.filter((fixture) => fixture.status !== 'Forfeit'),
      fetchMatchCentre,
      { concurrency: 3 }
    );
    if (other.failed.length > 0) {
      throw new Error(`${other.failed.length} of ${otherResults.length} other fixtures failed`);
    }
    const files: Record<string, string> = {};
    for (const [id, history] of histories) {
      files[playerSnapshotFile(id)] = JSON.stringify(history);
    }
    files[PARTICIPATION_SNAPSHOT_FILE] = JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        ...buildParticipationSnapshot(
          aggregatePlayerHistory([...matches, ...other.matches]).values(),
          [...results, ...otherResults]
        ),
      }
    );
    const changed = syncDir(outDir, files);
    fs.rmSync(path.join(path.dirname(outDir), 'players.json'), { force: true });
    recordRun('players', changed);
    console.log(`Saved ${histories.size} player histories to public/${PLAYERS_SNAPSHOT_DIR}/`);
  } catch (err) {
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
