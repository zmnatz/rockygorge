import type { EligibilityConfig, PlayerRow } from '@/types/eligibility';
import {
  aggregatePlayerHistory,
  fetchMatches,
  type FetchMatchesOptions,
  type MatchCentreData,
  type PlayerGameLog,
  type PlayerHistory,
} from '@/utils/playerHistory';

/** A fixture with a final score, as the player-history feed reports it. */
export interface ResultFixture {
  id: string;
  season: string;
  compName: string;
  dateTime: string;
  round?: string;
  status?: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
}

/** A result whose record can't be trusted to give a side's full participation:
 *  `no-lineup` has no players listed, `no-substitutions` lists substitutes but
 *  none came on, which usually means the match's substitutions weren't entered. */
export interface ParticipationGap {
  kind: 'no-lineup' | 'no-substitutions';
  fixtureId: string;
  teamName: string;
  opponent: string;
  competition: string;
  dateTime: string;
}

/** One season's Match Participation, written beside the player histories and
 *  read by the eligibility page. Rows have the same shape as Match Participation
 *  Report rows, with the CMS player id as the join key and no registration data. */
export interface ParticipationSnapshot {
  season: string;
  /** When the nightly job wrote this file; absent on a live pull. */
  generatedAt?: string;
  rows: PlayerRow[];
  gaps: ParticipationGap[];
}

export const PARTICIPATION_SNAPSHOT_FILE = 'participation.json';

/** Fetches the snapshot, or null when it isn't there. The host's catch-all
 *  rewrite answers a missing file with index.html and a 200, so a non-JSON
 *  response counts as missing. */
export async function loadParticipationSnapshot(): Promise<ParticipationSnapshot | null> {
  const res = await fetch(`/data/players/${PARTICIPATION_SNAPSHOT_FILE}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Match record request failed: ${res.status}`);
  if (!res.headers.get('content-type')?.includes('json')) return null;
  return (await res.json()) as ParticipationSnapshot;
}

function splitName(name: string): { firstName: string; lastName: string } {
  const [firstName = '', ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
}

function roundCode(game: PlayerGameLog): string {
  if (game.starter) return 'Start';
  return game.played ? 'Sub' : 'R';
}

export function buildParticipationSnapshot(
  histories: Iterable<PlayerHistory>,
  results: ResultFixture[],
  now: Date = new Date(),
): ParticipationSnapshot {
  // The feed can carry placeholder scores on fixtures that haven't happened.
  const played = results.filter((fixture) => new Date(fixture.dateTime) <= now);
  const season = played.reduce((latest, fixture) => (fixture.season > latest ? fixture.season : latest), '');
  const seasonResults = new Map(
    played.filter((fixture) => fixture.season === season).map((fixture) => [fixture.id, fixture]),
  );

  const rows = new Map<string, PlayerRow>();
  // Playing appearances per fixture and side, to spot gaps in the record.
  const listed = new Map<string, { substitutes: number; cameOn: number }>();

  for (const history of histories) {
    for (const game of history.games) {
      const fixture = seasonResults.get(game.fixtureId);
      if (!fixture || game.coach || fixture.status === 'Forfeit') continue;

      const rowKey = `${game.teamName}\0${game.compName}\0${history.id}`;
      const row = rows.get(rowKey) ?? {
        playerId: history.id,
        ...splitName(history.name),
        lastRegistered: '',
        teamName: game.teamName,
        competition: game.compName,
        appearances: 0,
        played: 0,
        substitute: 0,
        rounds: {},
      };
      if (game.played) row.appearances += 1;
      if (game.starter) row.played += 1;
      else if (game.played) row.substitute += 1;
      row.rounds[fixture.round || game.dateTime.slice(0, 10)] = roundCode(game);
      rows.set(rowKey, row);

      const sideKey = `${game.fixtureId}\0${game.teamName}`;
      const side = listed.get(sideKey) ?? { substitutes: 0, cameOn: 0 };
      if (!game.starter) {
        side.substitutes += 1;
        if (game.played) side.cameOn += 1;
      }
      listed.set(sideKey, side);
    }
  }

  const gaps: ParticipationGap[] = [];
  for (const fixture of seasonResults.values()) {
    // A forfeit was never played, so it has no lineup to miss.
    if (fixture.status === 'Forfeit') continue;
    const sides = [
      { teamName: fixture.homeTeam.name, opponent: fixture.awayTeam.name },
      { teamName: fixture.awayTeam.name, opponent: fixture.homeTeam.name },
    ];
    for (const { teamName, opponent } of sides) {
      const side = listed.get(`${fixture.id}\0${teamName}`);
      const kind = !side
        ? 'no-lineup'
        : side.substitutes > 0 && side.cameOn === 0
          ? 'no-substitutions'
          : null;
      if (kind) {
        gaps.push({
          kind,
          fixtureId: fixture.id,
          teamName,
          opponent,
          competition: fixture.compName,
          dateTime: fixture.dateTime,
        });
      }
    }
  }

  const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
  return {
    season,
    rows: [...rows.values()].sort(
      (a, b) =>
        compare(a.teamName, b.teamName) ||
        compare(a.competition, b.competition) ||
        compare(a.playerId, b.playerId),
    ),
    gaps: gaps.sort(
      (a, b) =>
        compare(a.dateTime, b.dateTime) ||
        compare(a.fixtureId, b.fixtureId) ||
        compare(a.teamName, b.teamName),
    ),
  };
}

/** A club fielding two sides in the record, the shape the regulations' two-side
 *  rules apply to. */
export interface Club {
  name: string;
  upperTeam: string;
  lowerTeam: string;
  upperLabel: string;
  lowerLabel: string;
}

const SIDE_NAME = /^(.+) (M|W)?D(\d+)$/;

function isQualifying(competition: string, config: EligibilityConfig): boolean {
  const name = competition.toLowerCase();
  return !config.nonQualifyingCompetitions.some((term) => name.includes(term.toLowerCase()));
}

/** The name fields listClubs needs from a fixture. */
interface FixtureSides {
  compName: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
}

/** Clubs with two sides in qualifying competitions, by name. A team name
 *  that doesn't end in a division can't be ranked and is skipped. */
export function listClubs(fixtures: FixtureSides[], config: EligibilityConfig): Club[] {
  const clubs = new Map<string, { name: string; sides: Map<string, number> }>();
  for (const fixture of fixtures) {
    if (!isQualifying(fixture.compName, config)) continue;
    for (const { name: teamName } of [fixture.homeTeam, fixture.awayTeam]) {
      const match = teamName.match(SIDE_NAME);
      if (!match) continue;
      const [, clubName, gender, level] = match;
      const name = gender === 'W' ? `${clubName} Women` : clubName;
      const club = clubs.get(name) ?? { name, sides: new Map<string, number>() };
      club.sides.set(teamName, Number(level));
      clubs.set(name, club);
    }
  }

  return [...clubs.values()]
    .filter((club) => club.sides.size === 2)
    .map((club) => {
      const [[upperTeam, upperLevel], [lowerTeam, lowerLevel]] = [...club.sides].sort(
        (a, b) => a[1] - b[1],
      );
      return {
        name: club.name,
        upperTeam,
        lowerTeam,
        upperLabel: `D${upperLevel}`,
        lowerLabel: `D${lowerLevel}`,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** The regulation thresholds, applied to this club's two sides. */
export function clubConfig(club: Club, base: EligibilityConfig): EligibilityConfig {
  return {
    ...base,
    upperDivision: { ...base.upperDivision, teamName: club.upperTeam, label: club.upperLabel },
    lowerDivision: { ...base.lowerDivision, teamName: club.lowerTeam, label: club.lowerLabel },
  };
}

/** The club's rows that count towards Match Participation. As in a Match
 *  Participation Report, every player has a row on both sides, so a player only
 *  ever listed on one side still gets a verdict for the other. */
export function participationRows(
  snapshot: ParticipationSnapshot,
  club: Club,
  config: EligibilityConfig,
): PlayerRow[] {
  const rows = snapshot.rows.filter(
    (row) =>
      (row.teamName === club.upperTeam || row.teamName === club.lowerTeam) &&
      isQualifying(row.competition, config),
  );
  const onSide = new Set(rows.map((row) => `${row.teamName}\0${row.playerId}`));
  const emptyRows = rows.flatMap((row) => {
    const otherTeam = row.teamName === club.upperTeam ? club.lowerTeam : club.upperTeam;
    const key = `${otherTeam}\0${row.playerId}`;
    if (onSide.has(key)) return [];
    onSide.add(key);
    return [
      {
        ...row,
        teamName: otherTeam,
        competition: '',
        appearances: 0,
        played: 0,
        substitute: 0,
        rounds: {},
      },
    ];
  });
  return [...rows, ...emptyRows];
}

/** Gaps that could change the club's verdicts. */
export function clubGaps(
  snapshot: ParticipationSnapshot,
  club: Club,
  config: EligibilityConfig,
): ParticipationGap[] {
  return snapshot.gaps.filter(
    (gap) =>
      (gap.teamName === club.upperTeam || gap.teamName === club.lowerTeam) &&
      isQualifying(gap.competition, config),
  );
}

/** A scheduled fixture with what a match-centre request needs. */
export interface ScheduledFixture {
  id: string;
  compId: string;
  compName: string;
  season: string;
  dateTime: string;
  round?: string;
  status?: string;
  sourceType: string;
  homeTeam: { name: string; score: string };
  awayTeam: { name: string; score: string };
}

const isScored = (fixture: { homeTeam: { score: string }; awayTeam: { score: string } }) =>
  fixture.homeTeam.score !== '' && fixture.awayTeam.score !== '';

/** Pulls one club's latest-season participation live. The schedule comes from the
 *  nightly fixture list, and each played match's score and lineup from the CMS.
 *  Throws if any match can't be fetched, since a partial count could wrongly pass
 *  or fail a player. */
async function pullClubParticipation(
  club: Club,
  fixtures: ScheduledFixture[],
  fetchMatch: (fixture: ScheduledFixture) => Promise<MatchCentreData | null>,
  now: Date,
  pullOptions: FetchMatchesOptions,
): Promise<ParticipationSnapshot> {
  const started = fixtures.filter((fixture) => new Date(fixture.dateTime) <= now);
  const season = started.reduce((latest, fixture) => (fixture.season > latest ? fixture.season : latest), '');
  const isClubSide = (name: string) => name === club.upperTeam || name === club.lowerTeam;
  const own = started.filter(
    (fixture) =>
      fixture.season === season &&
      (isClubSide(fixture.homeTeam.name) || isClubSide(fixture.awayTeam.name)),
  );
  const toFetch = own.filter((fixture) => fixture.status !== 'Forfeit');

  const { matches, failed } = await fetchMatches(toFetch, fetchMatch, {
    concurrency: 2,
    // Someone is waiting and the snapshot is the fallback, so don't sit out a
    // rate limit here.
    stopOnFailure: true,
    ...pullOptions,
  });
  if (failed.length > 0) {
    throw new Error(`${failed.length} of ${toFetch.length} matches could not be fetched`);
  }

  // A lineup can be posted before kickoff, so only scored matches count.
  const played = matches.filter((match) => isScored(match.fixture));
  const playedIds = new Set(played.map((match) => match.fixture.id));
  const results = own.filter((fixture) => playedIds.has(fixture.id) || isScored(fixture));

  return {
    ...buildParticipationSnapshot(aggregatePlayerHistory(played).values(), results, now),
    season,
  };
}

/** A club's participation and where it came from. */
export interface ClubRecord {
  snapshot: ParticipationSnapshot;
  source: 'live' | 'saved';
  /** When the data was read or written, if known. */
  asOf?: string;
  /** True when this is the saved snapshot because a live pull failed. */
  liveFailed: boolean;
}

interface ClubRecordDeps {
  /** Pull from the CMS; otherwise use only the saved snapshot (dev and tests). */
  live: boolean;
  fixtures: ScheduledFixture[];
  fetchMatch: (fixture: ScheduledFixture) => Promise<MatchCentreData | null>;
  loadSaved: () => Promise<ParticipationSnapshot | null>;
  now?: Date;
  pullOptions?: FetchMatchesOptions;
}

export async function loadClubRecord(
  club: Club,
  { live, fixtures, fetchMatch, loadSaved, now = new Date(), pullOptions = {} }: ClubRecordDeps,
): Promise<ClubRecord> {
  let liveFailed = false;
  if (live) {
    try {
      return {
        snapshot: await pullClubParticipation(club, fixtures, fetchMatch, now, pullOptions),
        source: 'live',
        asOf: now.toISOString(),
        liveFailed: false,
      };
    } catch {
      liveFailed = true;
    }
  }

  const saved = await loadSaved();
  const hasClub = saved?.rows.some(
    (row) => row.teamName === club.upperTeam || row.teamName === club.lowerTeam,
  );
  if (!saved || !hasClub) {
    throw new Error(`No saved match data for ${club.name}.`);
  }
  return { snapshot: saved, source: 'saved', asOf: saved.generatedAt, liveFailed };
}
