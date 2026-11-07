/**
 * Domain types for the player eligibility tool (pages/utils/eligibility.tsx).
 *
 * The rules encoded here follow the USA Club Rugby Senior Club Regulations
 * (§3.4.2, §3.5) for clubs with any number of sides — see
 * docs/adr/012-eligibility-for-any-number-of-sides.md.
 */

/** One player's totals for a team and competition: a row of the Rugby Xplorer
 *  "matches played" CSV export, or the same shape built from the match record. */
export interface PlayerRow {
  /** The join key across team rows: the USA Rugby registration number in a CSV
   *  report, the CMS player id in the match record. */
  playerId: string;
  firstName: string;
  lastName: string;
  /** `Player Last Registered` value — a date or "NA", empty in the match record.
   *  Shown, never enforced. */
  lastRegistered: string;
  /** Team this row belongs to (e.g. "Rocky Gorge MD1"), used to assign the
   *  row to one of the club's sides. */
  teamName: string;
  /** League/competition this row is reported under (e.g. "MAC Men D1"). */
  competition: string;
  appearances: number;
  played: number;
  substitute: number;
  /** Per-round attendance codes, for detail display and not used for eligibility.
   *  Keyed by column name (e.g. "Round 1") in a CSV report, and by fixture id in
   *  the match record, because a team can have two fixtures with one round name. */
  rounds: Record<string, string>;
}

/** One of a club's teams, e.g. "Rocky Gorge MD1" labelled "D1". */
export interface Side {
  teamName: string;
  label: string;
}

/** A club and its sides, highest division first. */
export interface Club {
  name: string;
  sides: Side[];
}

/** A player's Match Participation on another side of the club. */
export interface OtherSideParticipation {
  label: string;
  teamName: string;
  participation: number;
}

/** A player's eligibility verdict for one division, ready for display. */
export interface PlayerEligibility {
  playerId: string;
  firstName: string;
  lastName: string;
  /** Display name, "First Last". */
  name: string;
  lastRegistered: string;
  /** The team this verdict was built from (e.g. "Rocky Gorge MD1"). A combined
   *  verdict spans whatever competitions its rows reported under; the division's
   *  competitions are on DivisionSummary. */
  teamName: string;
  /** This row's match totals as reported. */
  played: number;
  substitute: number;
  /** Match Participation for this side — Played + Substitute. */
  participation: number;
  /** Match Participation on the club's other sides, highest division first. */
  otherSides: OtherSideParticipation[];
  /** The player's raw CSV rows for this team (one per competition), kept for
   *  the detail modal; eligibility runs on the combined totals above. */
  rows: PlayerRow[];
  eligible: boolean;
  /** Human-readable failure reasons; empty when eligible. */
  reasons: string[];
  /** Matches an eligible player still needs by Super Regionals; empty when the
   *  minimum is already met. These players are "on track". */
  pending: string[];
}

/** One side's verdicts and summary. */
export interface SideBreakdown extends Side {
  players: PlayerEligibility[];
  summary: DivisionSummary;
}

/** Per-side results, highest division first, i.e. the tool's output. */
export interface EligibilityBreakdown {
  sides: SideBreakdown[];
  /** Team names present in the rows that aren't one of the club's sides. */
  ignoredTeamNames: string[];
}

export interface DivisionSummary {
  total: number;
  eligible: number;
  /** How many of the eligible players still need matches to reach a minimum. */
  onTrack: number;
  /** Distinct competitions this side's roster spans, sorted. */
  competitions: string[];
}

/** The regulation's thresholds, config/eligibility.yml. */
export interface EligibilityRules {
  /** Minimum NCS Qualifying Matches (Reg 3.4.2(e), 3.5.2). */
  minimumMatches: number;
  /** A player reaching this many matches on any upper side loses eligibility for
   *  the sides below it (Reg 3.5(d)(i)). */
  upperMatchLimit: number;
  /** Competition-name fragments (case-insensitive) that are not NCS Qualifying
   *  Matches. Applied to the match record; a CSV report is taken as given. */
  nonQualifyingCompetitions: string[];
}

/** Each side's fixtures still to play before the Super Regionals deadline, by team name. */
export type RemainingMatches = Record<string, number>;
