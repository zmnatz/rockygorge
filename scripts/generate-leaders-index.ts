import fs from 'node:fs';
import path from 'node:path';
import {
  fetchAllCapitalFixtures,
  type StandingsSnapshotIndex,
  seasonSnapshotFile,
} from '../src/api/capital';
import {
  buildLeadersSnapshot,
  fetchLeaderMatch,
  type LeaderMatch,
  type MatchCache,
} from '../src/utils/leaders';

// Above this share of failed match-centre fetches (e.g. HTTP 429) the
// leaderboard would undercount, so the previous snapshot is kept instead.
const MAX_FAILED_SHARE = 0.05;

// Match centres persist between builds (Netlify caches .cache/, see
// netlify.toml), so only new or recent games hit the CMS.
const CACHE_PATH = path.join(process.cwd(), '.cache', 'leaders', 'matches.json');

function loadCache(): MatchCache & { save(): void } {
  let entries: Record<string, LeaderMatch | null> = {};
  try {
    entries = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
    // Entries cached before lineups carried player ids are refetched.
    for (const [id, match] of Object.entries(entries)) {
      if (match && [...match.players, ...match.substitutes].some((entry) => !entry.id)) {
        delete entries[id];
      }
    }
  } catch {
    // First build, or the cache was cleared.
  }
  return {
    get: (id) => (id in entries ? entries[id] : undefined),
    set: (id, match) => {
      entries[id] = match;
    },
    save: () => {
      fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
      fs.writeFileSync(CACHE_PATH, JSON.stringify(entries));
    },
  };
}

// Best-effort like the other snapshots: a throttled CMS must never fail the
// build. On failure the previous snapshot is kept; Netlify caches
// public/data/leaders between builds so there is one to keep.
async function generate() {
  console.log('Building scoring leaderboard snapshot for static export...');
  const outDir = path.join(process.cwd(), 'public', 'data', 'leaders');
  const cache = loadCache();
  try {
    const snapshot = await buildLeadersSnapshot({
      fetchFixtures: fetchAllCapitalFixtures,
      fetchMatch: fetchLeaderMatch,
      cache,
      concurrency: 3,
      gapMs: 300,
    });
    cache.save();
    if (snapshot.failed > snapshot.attempted * MAX_FAILED_SHARE) {
      console.warn(
        `Leaderboard: ${snapshot.failed} of ${snapshot.attempted} games failed to load, keeping previous snapshot`
      );
      return;
    }
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.mkdirSync(outDir, { recursive: true });
    for (const season of snapshot.seasons) {
      fs.writeFileSync(path.join(outDir, seasonSnapshotFile(season.season)), JSON.stringify(season));
    }
    // Same index shape as the standings snapshot; seasons are newest first,
    // and every listed season has played games, so the newest is the default.
    const seasons = snapshot.seasons.map((season) => season.season);
    const index: StandingsSnapshotIndex = {
      generatedAt: snapshot.generatedAt,
      defaultSeason: seasons[0] ?? '',
      seasons,
    };
    fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index));
    console.log(
      `Saved scoring leaders for ${snapshot.attempted - snapshot.failed} of ${snapshot.attempted} games across ${seasons.length} seasons to public/data/leaders/`
    );
  } catch (err) {
    console.warn('Leaderboard unavailable, keeping previous snapshot:', (err as Error).message);
  }
}

generate().catch((err) => {
  console.warn(
    'Failed to generate leaderboard snapshot, keeping previous snapshot:',
    (err as Error).message
  );
});
