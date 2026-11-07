import fs from 'node:fs';
import path from 'node:path';
import { seasonSnapshotFile } from '../../src/api/capital';
import type { MatchCentreData } from '../../src/utils/playerHistory';
import { syncDir } from './snapshot-freshness';

// The raw match-centre data for every played match, by season then fixture id,
// so snapshots are calculated locally instead of downloaded again. null records a
// match the CMS has no details for, so it isn't asked again. Committed under
// .cache/matches and refreshed by the player job. See docs/snapshots.md.
export type MatchArchive = Record<string, Record<string, MatchCentreData | null>>;

export const MATCH_ARCHIVE_DIR = path.join('.cache', 'matches');

interface ArchiveFixture {
  id: string;
  season: string;
}

/** The matches to download: every one from `refreshFrom` on, since the current
 *  season can still be corrected, and any locked-season match not yet stored.
 *  An empty `refreshFrom` downloads everything. */
export function matchesToFetch<Fixture extends ArchiveFixture>(
  fixtures: Fixture[],
  archive: MatchArchive,
  refreshFrom: string,
): Fixture[] {
  return fixtures.filter(
    (fixture) => fixture.season >= refreshFrom || !(fixture.id in (archive[fixture.season] ?? {})),
  );
}

/** The archive after a download: locked seasons keep what they had plus anything
 *  new, and seasons from `refreshFrom` on hold only what was just downloaded, so a
 *  fixture dropped from the schedule goes too. */
export function updateArchive(
  archive: MatchArchive,
  fetched: Map<string, { season: string; match: MatchCentreData | null }>,
  refreshFrom: string,
): MatchArchive {
  const next: MatchArchive = {};
  for (const [season, matches] of Object.entries(archive)) {
    if (season < refreshFrom) next[season] = { ...matches };
  }
  for (const [id, { season, match }] of fetched) {
    next[season] = { ...next[season], [id]: match };
  }
  return next;
}

/** The stored details for the schedule's fixtures, leaving out those with none. */
export function archivedMatches(archive: MatchArchive, fixtures: ArchiveFixture[]): MatchCentreData[] {
  return fixtures.flatMap((fixture) => {
    const match = archive[fixture.season]?.[fixture.id];
    return match ? [match] : [];
  });
}

export function readMatchArchive(dir: string): MatchArchive {
  if (!fs.existsSync(dir)) return {};
  const archive: MatchArchive = {};
  for (const name of fs.readdirSync(dir)) {
    const { season, matches } = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf-8'));
    archive[season] = matches;
  }
  return archive;
}

/** Writes one file per season, a match per line in fixture-id order so a season's
 *  diff shows only the matches that changed. Returns whether anything changed. */
export function writeMatchArchive(dir: string, archive: MatchArchive): boolean {
  const files: Record<string, string> = {};
  for (const [season, matches] of Object.entries(archive)) {
    const lines = Object.keys(matches)
      .sort()
      .map((id) => `${JSON.stringify(id)}:${JSON.stringify(matches[id])}`);
    files[seasonSnapshotFile(season)] =
      `{"season":${JSON.stringify(season)},"matches":{\n${lines.join(',\n')}\n}}\n`;
  }
  return syncDir(dir, files);
}
