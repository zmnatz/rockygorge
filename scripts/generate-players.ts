import path from 'node:path';
import {
  aggregatePlayerHistory,
  fetchMatchesInBatches,
  type MatchCentreData,
  PLAYERS_SNAPSHOT_DIR,
  playerSnapshotFile,
} from '../src/utils/playerHistory';
import { leagueResults, type ScheduledFixture } from '@zmnatz/usa-club-rugby-data';
import { readLeagueFixtures } from './lib/league-fixtures';
import { logRequestStats } from './lib/log-request-stats';
import {
  archivedMatches,
  MATCH_ARCHIVE_DIR,
  matchesToFetch,
  readMatchArchive,
  updateArchive,
  writeMatchArchive,
} from './lib/match-archive';
import { readManifest, recordRun, SNAPSHOT_FORMATS, skipIfFresh, syncDir } from './lib/snapshot-freshness';

// Downloads what the match archive is missing, then calculates every season's
// player histories from the archive. Locked seasons
// are never downloaded again, except for an archive format change or
// --full-history. Best-effort like the other snapshots: a throttled CMS never
// fails the build, and on failure the previous snapshot and archive are kept.
async function generate() {
  const outDir = path.join(process.cwd(), 'public', PLAYERS_SNAPSHOT_DIR);
  const archiveDir = path.join(process.cwd(), MATCH_ARCHIVE_DIR);
  if (skipIfFresh('players', outDir) && skipIfFresh('matches', archiveDir)) {
    return;
  }
  console.log('Building player histories from the match archive...');
  try {
    const results = leagueResults(readLeagueFixtures() as ScheduledFixture[]);
    const current = results.reduce((latest, fixture) => (fixture.season > latest ? fixture.season : latest), '');
    const fullHistory =
      process.argv.includes('--full-history') || readManifest().matches?.format !== SNAPSHOT_FORMATS.matches;
    const refreshFrom = fullHistory ? '' : current;
    const saved = fullHistory ? {} : readMatchArchive(archiveDir);

    const toFetch = matchesToFetch(results, saved, refreshFrom);
    const { matches, failed } = await fetchMatchesInBatches(toFetch);
    // A partial download would drop games, so the previous snapshot stays.
    if (failed.length > 0) {
      throw new Error(`${failed.length} of ${toFetch.length} matches failed`);
    }
    const byId = new Map(matches.map((match) => [match.fixture.id, match]));
    const fetched = new Map<string, { season: string; match: MatchCentreData | null }>(
      toFetch.map((fixture) => [fixture.id, { season: fixture.season, match: byId.get(fixture.id) ?? null }])
    );
    const archive = updateArchive(saved, fetched, refreshFrom);
    console.log(`Downloaded ${toFetch.length} matches (${fullHistory ? 'every season' : `${current} and any missing`}).`);

    const all = archivedMatches(archive, results);
    const histories = aggregatePlayerHistory(all);
    const files: Record<string, string> = {};
    for (const [id, history] of histories) {
      files[playerSnapshotFile(id)] = JSON.stringify(history);
    }
    recordRun('matches', writeMatchArchive(archiveDir, archive));
    recordRun('players', syncDir(outDir, files));
    console.log(`Saved ${histories.size} player histories from ${all.length} archived matches to public/${PLAYERS_SNAPSHOT_DIR}/`);
    logRequestStats('players');
  } catch (err) {
    // Fails the nightly run, so GitHub reports it; the previous snapshot stays.
    process.exitCode = 1;
    console.warn('Player histories unavailable, keeping previous snapshot:', (err as Error).message);
  }
}

generate().catch((err) => {
  // Fails the nightly run, so GitHub reports it; the previous snapshot stays.
  process.exitCode = 1;
  console.warn('Failed to generate player histories, keeping previous snapshot:', (err as Error).message);
});
