import fs from 'node:fs';
import path from 'node:path';
import { postWithRetry, sleep } from '../src/utils/api';
import { parseTeamSide, type TeamSide } from '../src/utils/teamSide';
import {
  CLUB_PAGES_FILE,
  clubPageCandidates,
  clubPageIsDue,
  crestEntityId,
  resolveClubPage,
  type ClubPage,
  type CmsEntity,
  type CmsSite,
} from '../src/utils/rugbyXplorer';
import { currentSeason, readLeagueFixtures } from './lib/league-fixtures';
import { logRequestStats } from './lib/log-request-stats';
import { readManifest, recordRun, SNAPSHOT_FORMATS, skipIfFresh, writeFileIfChanged } from './lib/snapshot-freshness';

const CMS_URL = 'https://rugby-au-cms.graphcdn.app';
const LOOKUP_GAP_MS = 250;

// Reusable only in the current format, and unless a full refresh was asked for.
function savedClubs(file: string): Record<string, ClubPage> {
  if (
    process.argv.includes('--full-history') ||
    readManifest().clubPages?.format !== SNAPSHOT_FORMATS.clubPages ||
    !fs.existsSync(file)
  ) {
    return {};
  }
  return JSON.parse(fs.readFileSync(file, 'utf-8')).clubs;
}

async function cms<T>(query: string, variables: Record<string, string> = {}): Promise<T> {
  const response = await postWithRetry<{ data: T }>(CMS_URL, { query, variables });
  return response.data;
}

async function lookupEntity(slug: string): Promise<CmsEntity> {
  await sleep(LOOKUP_GAP_MS);
  const data = await cms<{ entityDetails: CmsEntity }>(
    'query($slug:String){entityDetails(slug:$slug){id name type crest}}',
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
    const fixtures = readLeagueFixtures();
    // Only clubs playing this season are looked up again; a past club keeps its entry.
    const season = currentSeason();
    const playing = new Set(
      fixtures
        .filter((fixture) => fixture.season === season)
        .flatMap((fixture) => [fixture.homeTeam.name, fixture.awayTeam.name])
        .map((teamName) => parseTeamSide(teamName)?.clubName),
    );
    const saved = savedClubs(outFile);
    // Each club once, with the first real crest any of its sides carried. That
    // crest also gives the club's id, which confirms its page more surely than a name.
    const known = new Map<string, TeamSide & { crest: string | null }>();
    for (const fixture of fixtures) {
      for (const team of [fixture.homeTeam, fixture.awayTeam]) {
        const side = parseTeamSide(team.name);
        if (!side) continue;
        const crest = crestEntityId(team.crest) ? team.crest : null;
        const club = known.get(side.clubName);
        if (!club) known.set(side.clubName, { ...side, crest });
        else if (!club.crest) club.crest = crest;
      }
    }

    const clubs: Record<string, ClubPage> = {};
    let sites: CmsSite[] | undefined;
    for (const [name, club] of known) {
      const kept = saved[name];
      if (kept && (!playing.has(name) || !clubPageIsDue(kept))) {
        clubs[name] = kept;
        continue;
      }
      // The site list is large, so it's only fetched on a night something is due.
      sites ??= (await cms<{ sites: CmsSite[] }>('{sites{name slug}}')).sites;
      const entityId = club.crest ? crestEntityId(club.crest) : null;
      const page = await resolveClubPage(
        clubPageCandidates(club.baseName, club.gender, sites, entityId),
        entityId,
        club.baseName,
        lookupEntity,
      );
      clubs[name] = {
        slug: page?.slug ?? null,
        crest: page?.crest ?? club.crest,
        checkedAt: new Date().toISOString(),
      };
    }

    const changed = writeFileIfChanged(
      outFile,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          clubs: Object.fromEntries(Object.entries(clubs).sort(([a], [b]) => a.localeCompare(b))),
        },
        null,
        1,
      ),
    );
    recordRun('clubPages', changed);
    const all = Object.values(clubs);
    console.log(
      `${all.length} clubs: ${all.filter((club) => club.slug).length} pages, ${all.filter((club) => club.crest).length} crests.`
    );
    logRequestStats('club pages');
  } catch (err) {
    // Fails the nightly run, so GitHub reports it; the previous snapshot stays.
    process.exitCode = 1;
    console.warn('Club pages unavailable, keeping previous list:', (err as Error).message);
  }
}

generate().catch((err) => {
  // Fails the nightly run, so GitHub reports it; the previous snapshot stays.
  process.exitCode = 1;
  console.warn('Failed to generate club pages, keeping previous list:', (err as Error).message);
});
