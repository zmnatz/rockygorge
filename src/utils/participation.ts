import { clubsFromTeamNames, computeBreakdown } from '@/utils/eligibility';
import type {
  Club,
  EligibilityRules,
  PlayerEligibility,
  PlayerRow,
  RemainingMatches,
} from '@/types/eligibility';
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
  homeTeam: { name: string; score?: string };
  awayTeam: { name: string; score?: string };
}

/** The side that didn't forfeit, which takes the win: the higher score. Null when
 *  the scores don't say. */
export function forfeitWinner(fixture: ResultFixture): string | null {
  const home = Number(fixture.homeTeam.score);
  const away = Number(fixture.awayTeam.score);
  if (!fixture.homeTeam.score || !fixture.awayTeam.score || home === away) return null;
  return home > away ? fixture.homeTeam.name : fixture.awayTeam.name;
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
  /** The fixtures already accounted for, so a live pull can skip them. */
  resultIds?: string[];
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
      if (!fixture || game.coach) continue;
      // Reg 3.4(h): a forfeit counts for the non-forfeiting side's rostered players,
      // starters and replacements alike as nobody took the field, and for no one else.
      const isForfeit = fixture.status === 'Forfeit';
      if (isForfeit && forfeitWinner(fixture) !== game.teamName) continue;
      const counted = isForfeit ? { ...game, played: true } : game;

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
      if (counted.played) row.appearances += 1;
      if (counted.starter) row.played += 1;
      else if (counted.played) row.substitute += 1;
      row.rounds[fixture.id] = roundCode(counted);
      rows.set(rowKey, row);

      const sideKey = `${game.fixtureId}\0${game.teamName}`;
      const side = listed.get(sideKey) ?? { substitutes: 0, cameOn: 0 };
      if (!counted.starter) {
        side.substitutes += 1;
        if (counted.played) side.cameOn += 1;
      }
      listed.set(sideKey, side);
    }
  }

  const gaps: ParticipationGap[] = [];
  for (const fixture of seasonResults.values()) {
    // A forfeit counts only through the non-forfeiting side's roster, so only that
    // side can be missing one.
    const winner = fixture.status === 'Forfeit' ? forfeitWinner(fixture) : undefined;
    const sides = [
      { teamName: fixture.homeTeam.name, opponent: fixture.awayTeam.name },
      { teamName: fixture.awayTeam.name, opponent: fixture.homeTeam.name },
    ].filter(({ teamName }) => winner === undefined || teamName === winner);
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
    resultIds: [...seasonResults.keys()].sort(compare),
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

const isClubSide = (club: Club, teamName: string) =>
  club.sides.some((side) => side.teamName === teamName);

function isQualifying(competition: string, rules: EligibilityRules): boolean {
  const name = competition.toLowerCase();
  return !rules.nonQualifyingCompetitions.some((term) => name.includes(term.toLowerCase()));
}

/** The name fields listClubs needs from a fixture. */
interface FixtureSides {
  compName: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
}

/** A report's rows from competitions that count, so a CSV report follows the same
 *  rules as the match record. */
export function qualifyingRows(rows: PlayerRow[], rules: EligibilityRules): PlayerRow[] {
  return rows.filter((row) => isQualifying(row.competition, rules));
}

/** Clubs and their sides in qualifying competitions, by name. */
export function listClubs(fixtures: FixtureSides[], rules: EligibilityRules): Club[] {
  return clubsFromTeamNames(
    fixtures
      .filter((fixture) => isQualifying(fixture.compName, rules))
      .flatMap((fixture) => [fixture.homeTeam.name, fixture.awayTeam.name]),
  );
}

/** A competition's division: playoffs can be a separate competition from the
 *  league they belong to. */
const divisionOf = (compName: string) => compName.replace(/\s+playoffs?$/i, '').toLowerCase();

/** A match a side could still play before the Super Regionals deadline. */
export interface PossibleFixture {
  fixtureId?: string;
  teamName: string;
  competition: string;
  dateTime: string;
  /** Empty when the teams aren't assigned yet. */
  opponent: string;
  /** A playoff with no teams assigned, which the side may not reach. */
  open: boolean;
}

type ScheduleFixture = FixtureSides & {
  id?: string;
  dateTime: string;
  status?: string;
  homeTeam: { name: string; score: string };
  awayTeam: { name: string; score: string };
};

/** Each side's possible matches before the Super Regionals deadline, which count
 *  towards the two-match minimums. A postponed fixture has no date to count on,
 *  and a forfeit won't be played. Future playoff fixtures have no teams assigned,
 *  so any side in that division could play in them: each such date is one possible
 *  match, since a side plays once on a date however many fixtures are on it. */
export function possibleFixtures(
  fixtures: ScheduleFixture[],
  club: Pick<Club, 'sides'>,
  rules: EligibilityRules,
  now: Date = new Date(),
): Record<string, PossibleFixture[]> {
  const upcoming = fixtures.filter((fixture) => {
    return (
      new Date(fixture.dateTime) > now &&
      fixture.status !== 'Forfeit' &&
      fixture.status !== 'Postponed' &&
      fixture.homeTeam.score === '' &&
      fixture.awayTeam.score === '' &&
      isQualifying(fixture.compName, rules)
    );
  });
  const plays = (fixture: FixtureSides, team: string) =>
    fixture.homeTeam.name === team || fixture.awayTeam.name === team;
  const dateOf = (fixture: { dateTime: string }) => fixture.dateTime.slice(0, 10);

  const forSide = (teamName: string): PossibleFixture[] => {
    const divisions = new Set(
      fixtures.filter((fixture) => plays(fixture, teamName)).map((fixture) => divisionOf(fixture.compName)),
    );
    const own = upcoming.filter((fixture) => plays(fixture, teamName));
    const ownDates = new Set(own.map(dateOf));
    const openByDate = new Map<string, ScheduleFixture>();
    for (const fixture of upcoming) {
      const date = dateOf(fixture);
      if (
        (fixture.homeTeam.name === '' || fixture.awayTeam.name === '') &&
        divisions.has(divisionOf(fixture.compName)) &&
        !ownDates.has(date) &&
        !openByDate.has(date)
      ) {
        openByDate.set(date, fixture);
      }
    }
    const toPossible = (fixture: ScheduleFixture, open: boolean): PossibleFixture => ({
      fixtureId: fixture.id,
      teamName,
      competition: fixture.compName,
      dateTime: fixture.dateTime,
      opponent: open ? '' : fixture.homeTeam.name === teamName ? fixture.awayTeam.name : fixture.homeTeam.name,
      open,
    });
    return [
      ...own.map((fixture) => toPossible(fixture, false)),
      ...[...openByDate.values()].map((fixture) => toPossible(fixture, true)),
    ].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  };
  return Object.fromEntries(club.sides.map(({ teamName }) => [teamName, forSide(teamName)]));
}

/** How many possible matches each side has. */
export function remainingMatches(
  fixtures: ScheduleFixture[],
  club: Pick<Club, 'sides'>,
  rules: EligibilityRules,
  now: Date = new Date(),
): RemainingMatches {
  return Object.fromEntries(
    Object.entries(possibleFixtures(fixtures, club, rules, now)).map(([teamName, list]) => [teamName, list.length]),
  );
}

/** The club's rows that count towards Match Participation. As in a Match
 *  Participation Report, every player has a row on every side, so a player only
 *  ever listed on one side still gets a verdict for the others. */
export function participationRows(
  snapshot: ParticipationSnapshot,
  club: Club,
  rules: EligibilityRules,
): PlayerRow[] {
  const teams = club.sides.map((side) => side.teamName);
  const rows = snapshot.rows.filter(
    (row) => teams.includes(row.teamName) && isQualifying(row.competition, rules),
  );
  const onSide = new Set(rows.map((row) => `${row.teamName}\0${row.playerId}`));
  const emptyRows = rows.flatMap((row) =>
    teams.flatMap((teamName) => {
      const key = `${teamName}\0${row.playerId}`;
      if (onSide.has(key)) return [];
      onSide.add(key);
      return [
        {
          ...row,
          teamName,
          competition: '',
          appearances: 0,
          played: 0,
          substitute: 0,
          rounds: {},
        },
      ];
    }),
  );
  return [...rows, ...emptyRows];
}

/** Gaps that could change the club's verdicts. */
export function clubGaps(
  snapshot: ParticipationSnapshot,
  club: Club,
  rules: EligibilityRules,
): ParticipationGap[] {
  return snapshot.gaps.filter(
    (gap) => isClubSide(club, gap.teamName) && isQualifying(gap.competition, rules),
  );
}

/** A player's verdicts at one club: one per side the club fields. */
export interface PlayerClubEligibility {
  club: Club;
  verdicts: PlayerEligibility[];
}

/** One player's verdicts for the snapshot's season, from the saved record. */
export function playerSeasonEligibility(
  snapshot: ParticipationSnapshot,
  fixtures: Parameters<typeof remainingMatches>[0],
  playerId: string,
  rules: EligibilityRules,
  now: Date = new Date(),
): PlayerClubEligibility[] {
  const own = { ...snapshot, rows: snapshot.rows.filter((row) => row.playerId === playerId) };
  const teams = new Set(own.rows.map((row) => row.teamName));
  return listClubs(fixtures, rules)
    .filter((club) => club.sides.some((side) => teams.has(side.teamName)))
    .flatMap((club) => {
      const rows = participationRows(own, club, rules);
      if (rows.length === 0) return [];
      const { sides } = computeBreakdown(rows, club.sides, rules, remainingMatches(fixtures, club, rules, now));
      return [{ club, verdicts: sides.flatMap((side) => side.players) }];
    });
}

/** How one of a team's fixtures stands for one player. Only `started` and
 *  `substitute` count towards Match Participation. */
export type PlayerRoundStatus =
  | 'started'
  | 'substitute'
  | 'unused'
  | 'not-listed'
  | 'no-lineup'
  | 'forfeit'
  | 'forfeit-rostered'
  | 'postponed'
  | 'not-qualifying'
  | 'awaiting-result'
  | 'upcoming';

export interface PlayerRound {
  fixtureId: string;
  round: string;
  competition: string;
  dateTime: string;
  opponent: string;
  scoreFor: string;
  scoreAgainst: string;
  status: PlayerRoundStatus;
  counted: boolean;
  /** The side listed substitutes but none came on, so a reserve may have played. */
  substitutionsMissing: boolean;
}

interface PlayerRoundsInput {
  fixtures: (FixtureSides & {
    id: string;
    season: string;
    dateTime: string;
    round?: string;
    status?: string;
    homeTeam: { name: string; score: string };
    awayTeam: { name: string; score: string };
  })[];
  teamName: string;
  season: string;
  /** The player's rows, whatever side they are for. */
  rows: PlayerRow[];
  gaps: ParticipationGap[];
  resultIds: string[];
  rules: EligibilityRules;
  now?: Date;
}

/** Every fixture of a team's season and how it stands for one player, so a
 *  verdict can be checked match by match against the Rugby Xplorer reports. */
export function playerRounds({
  fixtures,
  teamName,
  season,
  rows,
  gaps,
  resultIds,
  rules,
  now = new Date(),
}: PlayerRoundsInput): PlayerRound[] {
  const results = new Set(resultIds);
  const hasGap = (fixtureId: string, kind: ParticipationGap['kind']) =>
    gaps.some((gap) => gap.kind === kind && gap.fixtureId === fixtureId && gap.teamName === teamName);

  const statusOf = (fixture: PlayerRoundsInput['fixtures'][number]): PlayerRoundStatus => {
    if (!isQualifying(fixture.compName, rules)) return 'not-qualifying';
    if (fixture.status === 'Postponed') return 'postponed';
    const code = rows.find((row) => row.teamName === teamName && row.competition === fixture.compName)
      ?.rounds[fixture.id];
    if (fixture.status === 'Forfeit') return code && code !== 'R' ? 'forfeit-rostered' : 'forfeit';
    if (code === 'Start') return 'started';
    if (code === 'Sub') return 'substitute';
    if (code === 'R') return 'unused';
    if (hasGap(fixture.id, 'no-lineup')) return 'no-lineup';
    if (new Date(fixture.dateTime) > now) return 'upcoming';
    return results.has(fixture.id) ? 'not-listed' : 'awaiting-result';
  };

  return fixtures
    .filter(
      (fixture) =>
        fixture.season === season &&
        (fixture.homeTeam.name === teamName || fixture.awayTeam.name === teamName),
    )
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
    .map((fixture) => {
      const isHome = fixture.homeTeam.name === teamName;
      const [own, other] = isHome
        ? [fixture.homeTeam, fixture.awayTeam]
        : [fixture.awayTeam, fixture.homeTeam];
      const status = statusOf(fixture);
      return {
        fixtureId: fixture.id,
        round: fixture.round || fixture.dateTime.slice(0, 10),
        competition: fixture.compName,
        dateTime: fixture.dateTime,
        opponent: other.name,
        scoreFor: own.score,
        scoreAgainst: other.score,
        status,
        counted: status === 'started' || status === 'substitute' || status === 'forfeit-rostered',
        substitutionsMissing: hasGap(fixture.id, 'no-substitutions'),
      };
    });
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

/** The league's played fixtures: every side, competition and season in the
 *  schedule. A fixture dated later can carry a placeholder score. */
export function leagueResults(
  schedule: ScheduledFixture[],
  now: Date = new Date(),
): ScheduledFixture[] {
  return schedule.filter((fixture) => isScored(fixture) && new Date(fixture.dateTime) <= now);
}

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
  saved: ParticipationSnapshot | null,
): Promise<ParticipationSnapshot | null> {
  const started = fixtures.filter((fixture) => new Date(fixture.dateTime) <= now);
  const season = started.reduce((latest, fixture) => (fixture.season > latest ? fixture.season : latest), '');
  // Build on the snapshot when it covers this club and season; otherwise pull it all.
  const base =
    saved?.resultIds &&
    saved.season === season &&
    club.sides.every((side) => saved.rows.some((row) => row.teamName === side.teamName))
      ? saved
      : null;
  const known = new Set(base?.resultIds);
  const own = started.filter(
    (fixture) =>
      fixture.season === season &&
      !known.has(fixture.id) &&
      fixture.status !== 'Postponed' &&
      (isClubSide(club, fixture.homeTeam.name) || isClubSide(club, fixture.awayTeam.name)),
  );
  // Every played fixture already has a result, so no requests are needed.
  if (base && own.length === 0) {
    return null;
  }
  const toFetch = own;

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

  const pulled: ParticipationSnapshot = {
    ...buildParticipationSnapshot(aggregatePlayerHistory(played).values(), results, now),
    season,
  };
  return base ? addParticipation(base, pulled) : pulled;
}

/** Adds newly pulled matches to a snapshot's totals. */
function addParticipation(
  base: ParticipationSnapshot,
  pulled: ParticipationSnapshot,
): ParticipationSnapshot {
  const key = (row: PlayerRow) => `${row.teamName}\0${row.competition}\0${row.playerId}`;
  const rows = new Map(base.rows.map((row) => [key(row), row]));
  for (const row of pulled.rows) {
    const existing = rows.get(key(row));
    rows.set(
      key(row),
      existing
        ? {
            ...existing,
            appearances: existing.appearances + row.appearances,
            played: existing.played + row.played,
            substitute: existing.substitute + row.substitute,
            rounds: { ...existing.rounds, ...row.rounds },
          }
        : row,
    );
  }
  return {
    ...base,
    resultIds: [...(base.resultIds ?? []), ...(pulled.resultIds ?? [])],
    rows: [...rows.values()],
    gaps: [...base.gaps, ...pulled.gaps],
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
  // A failed load only costs the head start when pulling live.
  const saved = await (live ? loadSaved().catch(() => null) : loadSaved());
  if (live) {
    try {
      const pulled = await pullClubParticipation(club, fixtures, fetchMatch, now, pullOptions, saved);
      if (pulled) {
        return { snapshot: pulled, source: 'live', asOf: now.toISOString(), liveFailed: false };
      }
    } catch {
      liveFailed = true;
    }
  }

  const hasClub = saved?.rows.some((row) => isClubSide(club, row.teamName));
  if (!saved || !hasClub) {
    throw new Error(`No saved match data for ${club.name}.`);
  }
  return { snapshot: saved, source: 'saved', asOf: saved.generatedAt, liveFailed };
}
