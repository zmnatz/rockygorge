import fs from 'node:fs';
import path from 'node:path';
import { type CapitalFixture, seasonSnapshotFile } from '../../src/api/capital';

const read = (file: string) =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'standings', file), 'utf-8'));

/** The current season's name, from the standings snapshot. */
export function currentSeason(): string {
  return read('index.json').defaultSeason;
}

/** Every side's fixtures in every season, newest season first, from the standings
 *  snapshot generated before this script. Throws if it's missing, so callers keep
 *  their previous snapshot rather than dropping sides. */
export function readLeagueFixtures(): CapitalFixture[] {
  const { seasons } = read('index.json') as { seasons: string[] };
  return seasons.flatMap((season) => read(seasonSnapshotFile(season)).fixtures);
}
