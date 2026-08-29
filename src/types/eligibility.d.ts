/**
 * Domain types for the player eligibility tool (pages/utils/eligibility.tsx).
 *
 * The rules encoded here follow the current USA Senior Club Regulations
 * (§3.4.2, §3.5) for clubs fielding two sides — see docs/adr/008-eligibility-rules.md.
 */

/** One row of the Rugby Xplorer "matches played" CSV export. */
export interface PlayerRow {
  /** The player's USA Rugby registration number; the join key across team rows. */
  usaId: string;
  firstName: string;
  lastName: string;
  /** `Player Last Registered` value — a date or "NA". Shown, never enforced. */
  lastRegistered: string;
  /** True when `Player Rego Active` is "Yes". */
  regoActive: boolean;
  /** Team this row belongs to (e.g. "Rocky Gorge MD1"), used to assign the
   *  row to the Upper or Lower Division. */
  teamName: string;
  /** League/competition this row is reported under (e.g. "MAC Men D1"). */
  competition: string;
  appearances: number;
  played: number;
  reserve: number;
  substitute: number;
}

/** Which team role a roster row maps to. */
export type DivisionRole = 'upper' | 'lower';

/** A player's eligibility verdict for one division, ready for display. */
export interface PlayerEligibility {
  usaId: string;
  firstName: string;
  lastName: string;
  /** Display name, "First Last". */
  name: string;
  lastRegistered: string;
  /** The team (and competition) of the roster row this verdict was built from. */
  teamName: string;
  competition: string;
  role: DivisionRole;
  /** This row's match totals as reported. */
  played: number;
  reserve: number;
  substitute: number;
  /** Match Participation for this division — Played + Substitute. */
  participation: number;
  /** Match Participation on the other division's team (0 when no row joins by USA ID). */
  otherDivisionParticipation: number;
  eligible: boolean;
  /** Human-readable failure reasons; empty when eligible. */
  reasons: string[];
}

/** Per-division results plus summaries, i.e. the tool's output. */
export interface EligibilityBreakdown {
  upper: PlayerEligibility[];
  lower: PlayerEligibility[];
  upperSummary: DivisionSummary;
  lowerSummary: DivisionSummary;
  /** Team names present in the CSV that map to neither configured division. */
  ignoredTeamNames: string[];
}

export interface DivisionSummary {
  total: number;
  eligible: number;
}

/** Config-driven team roles. */
export interface UpperDivisionConfig {
  teamName: string;
  label: string;
  /** Minimum NCS Qualifying Matches at any level for upper-division eligibility (Reg 3.4.2(d), 3.5.2(c)). */
  minimumTotalMatches: number;
}

export interface LowerDivisionConfig {
  teamName: string;
  label: string;
  /** Minimum matches at the lower division itself (Reg 3.5.2(a)). */
  minimumMatches: number;
  /** Playing this many upper-division matches forfeits lower-division eligibility (Reg 3.5(d)(i)). */
  upperMatchLimit: number;
  /** Lower-division participation must be at least the upper-division count (Reg 3.5(d)(ii)(a), Figure 1). */
  lowerAtLeastUpper: boolean;
}

export interface EligibilityConfig {
  upperDivision: UpperDivisionConfig;
  lowerDivision: LowerDivisionConfig;
}