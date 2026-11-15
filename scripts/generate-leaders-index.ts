import path from 'node:path';
import type { StandingsSnapshotIndex } from '../src/api/capital';
import { readLeagueFixtures } from './lib/league-fixtures';
import { MATCH_ARCHIVE_DIR, readMatchArchive } from './lib/match-archive';
import { writeSeasonSnapshot } from './lib/write-season-snapshot';
import { buildLeadersSnapshot, leaderMatchFrom, type MatchCache } from '../src/utils/leaders';

// Calculates the scoring leaderboards from the committed match archive and the standings
// snapshot's fixtures, with no CMS requests. `bun run build` runs it; public/data/leaders/
// is not committed (ADR 016). The standings snapshot and the archive are the nightly job's.
const noCache: MatchCache = { get: () => undefined, set: () => {} };

async function generate() {
  console.log('Building scoring leaderboards from the match archive...');
  const outDir = path.join(process.cwd(), 'public', 'data', 'leaders');
  const archive = readMatchArchive(path.join(process.cwd(), MATCH_ARCHIVE_DIR));
  const lookup = new Map(Object.values(archive).flatMap((matches) => Object.entries(matches)));
  const snapshot = await buildLeadersSnapshot({
    fetchFixtures: async () => readLeagueFixtures(),
    fetchMatch: async (fixture) => {
      const data = lookup.get(fixture.id);
      return data ? leaderMatchFrom(fixture, data) : null;
    },
    cache: noCache,
  });
  // Same index shape as the standings snapshot; seasons are newest first, and every listed
  // season has played games, so the newest is the default.
  const seasons = snapshot.seasons.map((season) => season.season);
  const index: StandingsSnapshotIndex = {
    generatedAt: snapshot.generatedAt,
    defaultSeason: seasons[0] ?? '',
    seasons,
  };
  writeSeasonSnapshot(outDir, index, snapshot.seasons);
  console.log(
    `Saved scoring leaders for ${snapshot.attempted - snapshot.failed} of ${snapshot.attempted} games across ${seasons.length} seasons to public/data/leaders/`
  );
}

generate().catch((err) => {
  // A build without its leaderboards would ship an empty tab, so it fails instead.
  console.error('Failed to build the scoring leaderboards:', err);
  process.exit(1);
});
