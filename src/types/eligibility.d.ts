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
  /** Team this row belongs to (e.g. "Rocky Gorge MD1"), used to assign the
   *  row to the Upper or Lower Division. */
  teamName: string;
  /** League/competition this row is reported under (e.g. "MAC Men D1"). */
  competition: string;
  appearances: number;
  played: number;
  substitute: number;
  /** Per-round attendance codes, keyed by column name (e.g. "Round 1").
   *  Carried for detail display; not used for eligibility. */
  rounds: Record<string, string>;
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
  /** The team this verdict was built from (e.g. "Rocky Gorge MD1"). A combined
   *  verdict spans whatever competitions its rows reported under; the division's
   *  competitions are on DivisionSummary. */
  teamName: string;
  role: DivisionRole;
  /** This row's match totals as reported. */
  played: number;
  substitute: number;
  /** Match Participation for this division — Played + Substitute. */
  participation: number;
  /** Match Participation on the other division's team (0 when no row joins by USA ID). */
  otherDivisionParticipation: number;
  /** The player's raw CSV rows for this team (one per competition), kept for
   *  the detail modal; eligibility runs on the combined totals above. */
  rows: PlayerRow[];
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
  /** Distinct competitions this division's roster spans, sorted. */
  competitions: string[];
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