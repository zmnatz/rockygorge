import fs from 'node:fs';
import path from 'node:path';
import {
  aggregatePlayerHistory,
  buildPlayerHistories,
  mergeSavedHistories,
  type PlayerHistory,
  PLAYERS_SNAPSHOT_DIR,
  playerSnapshotFile,
} from '../src/utils/playerHistory';
import {
  buildParticipationSnapshot,
  leagueResults,
  PARTICIPATION_SNAPSHOT_FILE,
  type ScheduledFixture,
} from '../src/utils/participation';
import { readLeagueFixtures } from './lib/league-fixtures';
import { logRequestStats } from './lib/log-request-stats';
import {
  readManifest,
  recordRun,
  SNAPSHOT_FORMATS,
  skipIfFresh,
  syncDir,
} from './lib/snapshot-freshness';

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
    // Only the current season is pulled; past seasons come from the saved files.
    // Saved files in an older format can't be reused, and --full-history forces
    // a complete pull to pick up corrections to past seasons.
    const saved = readSavedHistories(outDir);
    const fullHistory =
      process.argv.includes('--full-history') ||
      saved.length === 0 ||
      readManifest().players?.format !== SNAPSHOT_FORMATS.players;
    const { histories: pulled, results, matches, season } = await buildPlayerHistories(
      leagueResults(readLeagueFixtures() as ScheduledFixture[]),
      { concurrency: 3, fullHistory }
    );
    const histories = fullHistory ? pulled : mergeSavedHistories(saved, pulled, season);
    console.log(`Fetched ${matches.length} matches (${fullHistory ? 'all seasons' : season}).`);
    const files: Record<string, string> = {};
    for (const [id, history] of histories) {
      files[playerSnapshotFile(id)] = JSON.stringify(history);
    }
    files[PARTICIPATION_SNAPSHOT_FILE] = JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        ...buildParticipationSnapshot(aggregatePlayerHistory(matches).values(), results),
      }
    );
    const changed = syncDir(outDir, files);
    fs.rmSync(path.join(path.dirname(outDir), 'players.json'), { force: true });
    recordRun('players', changed);
    console.log(`Saved ${histories.size} player histories to public/${PLAYERS_SNAPSHOT_DIR}/`);
    logRequestStats('players');
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
