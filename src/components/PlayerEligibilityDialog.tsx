import { useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Link as MuiLink,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { EligibilityStatusChip } from '@/components/EligibilityStatusChip';
import {
  playerRounds,
  possibleFixtures,
  type ParticipationSnapshot,
  type PlayerRound,
  type PlayerRoundStatus,
  type ScheduledFixture,
} from '@/utils/participation';
import { matchUrl } from '@/utils/rugbyXplorer';
import eligibility from '@config/eligibility.yml';
import type { Club, PlayerEligibility, PlayerRow } from '@/types/eligibility';

/** Where a report's rows came from. Only a CSV report carries USA IDs and
 *  registration dates. */
export type ReportSource = 'record' | 'csv';

/** One labeled fact row in the player detail dialog. */
function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.5 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 'medium', textAlign: 'right' }}>
        {value ?? '—'}
      </Typography>
    </Box>
  );
}

/** The per-round attendance codes across a player's competitions, as a matrix
 *  with one row per competition and one Round column per reported round. */
function RoundsMatrix({ rows }: { rows: PlayerRow[] }) {
  const roundNames = useMemo(() => {
    const names = new Set<string>();
    for (const source of rows) {
      for (const name of Object.keys(source.rounds)) names.add(name);
    }
    return [...names].sort((a, b) => {
      const numOf = (name: string) => Number(name.match(/\d+/)?.[0]);
      const na = numOf(a);
      const nb = numOf(b);
      if (Number.isNaN(na) && Number.isNaN(nb)) return a.localeCompare(b);
      if (Number.isNaN(na)) return 1;
      if (Number.isNaN(nb)) return -1;
      return na - nb;
    });
  }, [rows]);

  if (roundNames.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No round data.
      </Typography>
    );
  }
  return (
    <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Competition</TableCell>
            {roundNames.map((round) => (
              <TableCell key={round} align="center">
                {round}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((source) => (
            <TableRow key={source.competition || 'report row'}>
              <TableCell>{source.competition || 'Report row'}</TableCell>
              {roundNames.map((round) => {
                const code = source.rounds[round];
                const shown = code && code !== 'R' ? code : null;
                return (
                  <TableCell key={round} align="center">
                    {shown ?? (
                      <Box component="span" sx={{ color: 'text.disabled' }}>
                        —
                      </Box>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/** What's needed to set a player's verdict against the team's fixtures. */
export interface RoundAccounting {
  snapshot: ParticipationSnapshot;
  fixtures: ScheduledFixture[];
  clubSlug: string | null;
  /** The club's sides, upper first. */
  sides: string[];
}

const ROUND_STATUS: Record<PlayerRoundStatus, string> = {
  started: 'Started',
  substitute: 'Came on as a substitute',
  unused: "Listed as a substitute, didn't come on",
  'not-listed': 'Not in the lineup',
  'no-lineup': 'No lineup recorded',
  forfeit: 'Forfeit, not counted',
  'forfeit-rostered': 'On the roster for a forfeit win',
  postponed: 'Postponed',
  'not-qualifying': 'Not an NCS Qualifying Match',
  'awaiting-result': 'No result yet',
  upcoming: 'Still to play',
};

function roundDate(dateTime: string): string {
  return new Date(dateTime).toLocaleDateString(undefined, { timeZone: 'UTC' });
}

/** One team's fixtures for one player, each linked to its Rugby Xplorer report. */
function TeamRounds({
  teamName,
  rounds,
  clubSlug,
}: {
  teamName: string;
  rounds: PlayerRound[];
  clubSlug: string | null;
}) {
  const counted = rounds.filter((round) => round.counted).length;
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2">
        {teamName}: {counted} counted {counted === 1 ? 'match' : 'matches'}
      </Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Round</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Opponent</TableCell>
              <TableCell>Score</TableCell>
              <TableCell>This player</TableCell>
              <TableCell align="center">Counted</TableCell>
              <TableCell>Report</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rounds.map((round) => (
              <TableRow key={round.fixtureId}>
                <TableCell>{round.round}</TableCell>
                <TableCell>{roundDate(round.dateTime)}</TableCell>
                <TableCell>{round.opponent || 'To be decided'}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  {round.scoreFor || round.scoreAgainst ? `${round.scoreFor} - ${round.scoreAgainst}` : '—'}
                </TableCell>
                <TableCell>
                  {ROUND_STATUS[round.status]}
                  {round.substitutionsMissing && (
                    <Typography variant="caption" color="warning.main" component="div">
                      No substitutions recorded for this match
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="center">{round.counted ? 'Yes' : 'No'}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <MuiLink href={matchUrl(round.fixtureId, clubSlug)} target="_blank" rel="noopener noreferrer">
                    Rugby Xplorer
                  </MuiLink>
                </TableCell>
              </TableRow>
            ))}
            {rounds.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ color: 'text.secondary' }}>
                  No fixtures this season.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

/** A round table for each side the player has played for, own side first; every
 *  side feeds the verdict. A side they haven't played for gets only a line. */
function PlayedRounds({ player, accounting }: { player: PlayerEligibility; accounting: RoundAccounting }) {
  const sides = [player.teamName, ...accounting.sides.filter((side) => side !== player.teamName)].map(
    (teamName) => ({
      teamName,
      rounds: playerRounds({
        fixtures: accounting.fixtures,
        teamName,
        season: accounting.snapshot.season,
        rows: player.rows,
        gaps: accounting.snapshot.gaps,
        resultIds: accounting.snapshot.resultIds ?? [],
        rules: eligibility,
      }),
    }),
  );
  const notPlayed = sides.filter(({ rounds }) => !rounds.some((round) => round.counted));
  return (
    <>
      {sides
        .filter(({ rounds }) => rounds.some((round) => round.counted))
        .map(({ teamName, rounds }) => (
          <TeamRounds key={teamName} teamName={teamName} clubSlug={accounting.clubSlug} rounds={rounds} />
        ))}
      {notPlayed.length > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          No matches played this season for {notPlayed.map(({ teamName }) => teamName).join(', ')}.
        </Typography>
      )}
    </>
  );
}

/** The club's schedule, for justifying an on-track verdict. */
export interface ClubSchedule {
  club: Club;
  fixtures: ScheduledFixture[];
  clubSlug: string | null;
}

/** The fixtures behind an on-track verdict: those the verdict counted as possible,
 *  on the player's side and the sides below it, or every side for the top one. */
function PossibleFixtures({ player, schedule }: { player: PlayerEligibility; schedule: ClubSchedule }) {
  const { club, fixtures, clubSlug } = schedule;
  const lists = possibleFixtures(fixtures, club, eligibility);
  const index = club.sides.findIndex((side) => side.teamName === player.teamName);
  const possible = club.sides
    .slice(Math.max(index, 0))
    .flatMap((side) => lists[side.teamName] ?? [])
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2">Possible fixtures: {possible.length} left</Typography>
      <Typography variant="caption" color="text.secondary">
        Why this player is on track. They could still reach the minimum in these fixtures, though
        availability isn&apos;t checked and a side may not reach a playoff. On track is experimental:
        future playoff matches aren&apos;t always entered in Rugby Xplorer, so this list may be incomplete.
      </Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Side</TableCell>
              <TableCell>Opponent</TableCell>
              <TableCell>Competition</TableCell>
              <TableCell>Report</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {possible.map((fixture) => (
              <TableRow key={`${fixture.teamName}-${fixture.fixtureId ?? fixture.dateTime}`}>
                <TableCell>{roundDate(fixture.dateTime)}</TableCell>
                <TableCell>{fixture.teamName}</TableCell>
                <TableCell>{fixture.open ? 'Playoff, teams not decided' : fixture.opponent || 'To be decided'}</TableCell>
                <TableCell>{fixture.competition}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  {fixture.fixtureId && (
                    <MuiLink href={matchUrl(fixture.fixtureId, clubSlug)} target="_blank" rel="noopener noreferrer">
                      Rugby Xplorer
                    </MuiLink>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

/** Full report detail for one player, opened by clicking a table row. */
export function PlayerEligibilityDialog({
  player,
  source,
  ownLabel,
  accounting,
  schedule,
  showCmsId = false,
  showHistoryLink = false,
  footer,
  onClose,
}: {
  player: PlayerEligibility | null;
  source: ReportSource;
  ownLabel: string;
  accounting: RoundAccounting | null;
  schedule: ClubSchedule | null;
  /** Tells this player apart from another with the same name. */
  showCmsId?: boolean;
  /** Links to the player's page, for when the dialog isn't already on it. */
  showHistoryLink?: boolean;
  footer?: ReactNode;
  onClose: () => void;
}) {
  return (
    <Dialog open={player !== null} onClose={onClose} maxWidth="md" fullWidth>
      {player !== null && (
        <>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="h6" component="span">
                {player.name}
              </Typography>
              {source === 'csv' && (
                <Typography variant="body2" color="text.secondary" component="span">
                  USA ID {player.playerId}
                </Typography>
              )}
              {source === 'record' && showCmsId && (
                <Typography variant="body2" color="text.secondary" component="span">
                  CMS ID {player.playerId}
                </Typography>
              )}
              <EligibilityStatusChip player={player} />
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {player.reasons.length > 0 && (
              <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                {player.reasons.join(' · ')}
              </Typography>
            )}
            {player.pending.length > 0 && (
              <Typography variant="body2" sx={{ mb: 2 }}>
                {player.pending.join(' · ')}
              </Typography>
            )}
            <Box>
              {source === 'csv' && <Fact label="Last registered" value={player.lastRegistered} />}
              <Fact label="Side" value={`${ownLabel} side`} />
              <Fact label="Played" value={player.played} />
              <Fact label="Substitute" value={player.substitute} />
              <Fact label="Participation" value={player.participation} />
              {player.otherSides.map((side) => (
                <Fact key={side.teamName} label={`${side.label} participation`} value={side.participation} />
              ))}
            </Box>
            {schedule && player.pending.length > 0 && <PossibleFixtures player={player} schedule={schedule} />}
            {accounting ? (
              <>
                <PlayedRounds player={player} accounting={accounting} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Open a report to check a line against Rugby Xplorer.{' '}
                  {showHistoryLink && (
                    <MuiLink component={Link} href={`/player?id=${encodeURIComponent(player.playerId)}`}>
                      Player history
                    </MuiLink>
                  )}
                </Typography>
              </>
            ) : (
              <>
                {player.rows.map((source) => (
                  <Box key={source.competition || 'report row'} sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">
                      {source.competition || 'Report row'} — {source.teamName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Appearances {source.appearances} · Played {source.played} · Substitute{' '}
                      {source.substitute}
                    </Typography>
                  </Box>
                ))}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Rounds by competition</Typography>
                  <RoundsMatrix rows={player.rows} />
                </Box>
              </>
            )}
            {footer}
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}
