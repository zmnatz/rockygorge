import path from 'node:path';
import type {
  StandingsSnapshotIndex,
} from '../src/api/capital';
import { readLeagueFixtures } from './lib/league-fixtures';
import { logRequestStats } from './lib/log-request-stats';
import { MATCH_ARCHIVE_DIR, readMatchArchive } from './lib/match-archive';
import { recordRun, skipIfFresh } from './lib/snapshot-freshness';
import { writeSeasonSnapshot } from './lib/write-season-snapshot';
import {
  buildLeadersSnapshot,
  leaderMatchFrom,
  type MatchCache,
} from '../src/utils/leaders';

// Above this share of failed match-centre fetches the leaderboard would
// undercount, so the previous snapshot is kept instead. Matches come from the
// archive, so nothing is fetched and none fail.
const MAX_FAILED_SHARE = 0.05;

// Leaders read the match archive the player job keeps, so they never ask the CMS.
const noCache: MatchCache = { get: () => undefined, set: () => {} };

// Best-effort like the other snapshots: a throttled CMS must never fail the
// build. On failure the previous (committed) snapshot is kept.
async function generate() {
  console.log('Building scoring leaderboard snapshot for static export...');
  const outDir = path.join(process.cwd(), 'public', 'data', 'leaders');
  if (skipIfFresh('leaders', path.join(outDir, 'index.json'))) {
    return;
  }
  const archive = readMatchArchive(path.join(process.cwd(), MATCH_ARCHIVE_DIR));
  const lookup = new Map(
    Object.values(archive).flatMap((matches) => Object.entries(matches))
  );
  try {
    const snapshot = await buildLeadersSnapshot({
      fetchFixtures: async () => readLeagueFixtures(),
      fetchMatch: async (fixture) => {
        const data = lookup.get(fixture.id);
        return data ? leaderMatchFrom(fixture, data) : null;
      },
      cache: noCache,
    });
    if (snapshot.failed > snapshot.attempted * MAX_FAILED_SHARE) {
      // Fails the nightly run, so GitHub reports it; the previous snapshot stays.
      process.exitCode = 1;
      console.warn(
        `Leaderboard: ${snapshot.failed} of ${snapshot.attempted} games failed to load, keeping previous snapshot`
      );
      return;
    }
    // Same index shape as the standings snapshot; seasons are newest first,
    // and every listed season has played games, so the newest is the default.
    const seasons = snapshot.seasons.map((season) => season.season);
    const index: StandingsSnapshotIndex = {
      generatedAt: snapshot.generatedAt,
      defaultSeason: seasons[0] ?? '',
      seasons,
    };
    recordRun('leaders', writeSeasonSnapshot(outDir, index, snapshot.seasons));
    console.log(
      `Saved scoring leaders for ${snapshot.attempted - snapshot.failed} of ${snapshot.attempted} games across ${seasons.length} seasons to public/data/leaders/`
    );
    logRequestStats('leaders');
  } catch (err) {
    // Fails the nightly run, so GitHub reports it; the previous snapshot stays.
    process.exitCode = 1;
    console.warn('Leaderboard unavailable, keeping previous snapshot:', (err as Error).message);
  }
}

generate().catch((err) => {
  // Fails the nightly run, so GitHub reports it; the previous snapshot stays.
  process.exitCode = 1;
  console.warn(
    'Failed to generate leaderboard snapshot, keeping previous snapshot:',
    (err as Error).message
  );
});
