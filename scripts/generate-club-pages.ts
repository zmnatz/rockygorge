import fs from 'node:fs';
import path from 'node:path';
import eligibility from '@config/eligibility.yml';
import { seasonSnapshotFile, type CapitalFixture } from '../src/api/capital';
import { postWithRetry, sleep } from '../src/utils/api';
import { listClubs } from '../src/utils/participation';
import {
  CLUB_PAGES_FILE,
  clubPageCandidates,
  crestEntityId,
  resolveClubPage,
  type ClubPages,
  type CmsEntity,
  type CmsSite,
} from '../src/utils/rugbyXplorer';
import { recordRun, skipIfFresh, writeFileIfChanged } from './lib/snapshot-freshness';

const CMS_URL = 'https://rugby-au-cms.graphcdn.app';
const LOOKUP_GAP_MS = 250;

function currentSeasonFixtures(): CapitalFixture[] {
  const dir = path.join(process.cwd(), 'public', 'data', 'standings');
  const read = (file: string) => JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
  return read(seasonSnapshotFile(read('index.json').defaultSeason)).fixtures;
}

async function cms<T>(query: string, variables: Record<string, string> = {}): Promise<T> {
  const response = await postWithRetry<{ data: T }>(CMS_URL, { query, variables });
  return response.data;
}

async function lookupEntity(slug: string): Promise<CmsEntity> {
  await sleep(LOOKUP_GAP_MS);
  const data = await cms<{ entityDetails: CmsEntity }>(
    'query($slug:String){entityDetails(slug:$slug){id name type}}',
    { slug },
  );
  return data.entityDetails;
}

// Best-effort like the other snapshots: on failure the previous list is kept.
async function generate() {
  const outFile = path.join(process.cwd(), 'public', 'data', CLUB_PAGES_FILE);
  if (skipIfFresh('clubPages', outFile)) {
    return;
  }
  console.log('Confirming Rugby Xplorer club pages through the CMS...');
  try {
    const fixtures = currentSeasonFixtures();
    const { sites } = await cms<{ sites: CmsSite[] }>('{sites{name slug}}');
    const crests = new Map<string, string>();
    for (const fixture of fixtures) {
      for (const team of [fixture.homeTeam, fixture.awayTeam]) {
        crests.set(team.name, team.crest);
      }
    }

    const clubs: ClubPages = {};
    for (const club of listClubs(fixtures, eligibility)) {
      const isWomen = club.name.endsWith(' Women');
      const baseName = club.name.replace(/ Women$/, '');
      // A side's crest may be stored elsewhere, so either side can supply the id.
      const entityId =
        [club.upperTeam, club.lowerTeam]
          .map((team) => (team ? crestEntityId(crests.get(team) ?? '') : null))
          .find(Boolean) ?? null;
      clubs[club.name] = await resolveClubPage(
        clubPageCandidates(baseName, isWomen ? 'W' : 'M', sites, entityId),
        entityId,
        baseName,
        lookupEntity,
      );
    }

    const changed = writeFileIfChanged(
      outFile,
      JSON.stringify({ generatedAt: new Date().toISOString(), clubs }),
    );
    recordRun('clubPages', changed);
    const found = Object.values(clubs).filter(Boolean).length;
    console.log(`Confirmed ${found} of ${Object.keys(clubs).length} club pages.`);
  } catch (err) {
    console.warn('Club pages unavailable, keeping previous list:', (err as Error).message);
  }
}

generate().catch((err) => {
  console.warn('Failed to generate club pages, keeping previous list:', (err as Error).message);
});
