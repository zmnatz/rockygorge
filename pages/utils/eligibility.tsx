import { useMemo, useState, type ChangeEvent } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { loadCurrentSeasonFixtures } from '@/api/capital';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  FormControl,
  InputLabel,
  Link as MuiLink,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Dialog,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import {
  PlayerEligibilityDialog,
  type ClubSchedule,
  type ReportSource,
  type RoundAccounting,
} from '@/components/PlayerEligibilityDialog';
import { EligibilityStatusChip } from '@/components/EligibilityStatusChip';
import {
  clubsInRows,
  computeBreakdown,
  divisionLabel,
  hasSharedName,
  parsePlayerRows,
  sameNamePlayers,
  sharedNames,
} from '@/utils/eligibility';
import {
  clubGaps,
  listClubs,
  loadClubRecord,
  loadParticipationSnapshot,
  participationRows,
  remainingMatches,
  type ParticipationGap,
} from '@/utils/participation';
import { clubPages } from '@/utils/clubPages';
import { fixturesUrl, RUGBY_XPLORER_URL } from '@/utils/rugbyXplorer';
import { fetchMatchCentre } from '@/utils/playerHistory';
import { compareValues, type SortDirection } from '@/utils/sort';
import eligibility from '@config/eligibility.yml';

import type {
  EligibilityBreakdown,
  PlayerEligibility,
  PlayerRow,
} from '@/types/eligibility';

// Deployed pages pull live; dev uses the saved snapshot so working on the page
// doesn't hit the CMS.
const LIVE_RECORD = process.env.NODE_ENV === 'production';
const LIVE_RECORD_STALE_MS = 10 * 60 * 1000;

/** This site's own club, shown first. */
const DEFAULT_CLUB = 'Rocky Gorge';

type StatusFilter = 'all' | 'eligible' | 'ineligible';

/** A fixed column, or `other:<label>` for another side's participation. */
type SortKey =
  | 'name'
  | 'lastRegistered'
  | 'played'
  | 'sub'
  | 'participation'
  | 'status'
  | 'reasons'
  | `other:${string}`;

const getColumns = (
  otherLabels: string[],
  source: ReportSource,
): { key: SortKey; title: string; numeric?: boolean }[] => [
  { key: 'name', title: 'Player' },
  ...(source === 'csv' ? [{ key: 'lastRegistered' as const, title: 'Last Registered' }] : []),
  { key: 'played', title: 'Played', numeric: true },
  { key: 'sub', title: 'Sub', numeric: true },
  { key: 'participation', title: 'Participation', numeric: true },
  ...otherLabels.map((label) => ({
    key: `other:${label}` as const,
    title: `${label} Participation`,
    numeric: true,
  })),
  { key: 'status', title: 'Status' },
  { key: 'reasons', title: 'Reason' },
];

/** A player's participation for an `other:<label>` column. */
function otherSideCount(player: PlayerEligibility, key: `other:${string}`): number {
  const label = key.slice('other:'.length);
  return player.otherSides.find((side) => side.label === label)?.participation ?? 0;
}

function sortValue(player: PlayerEligibility, key: SortKey): string | number {
  switch (key) {
    case 'name':
      return player.name;
    case 'lastRegistered':
      return player.lastRegistered;
    case 'played':
      return player.played;
    case 'sub':
      return player.substitute;
    case 'participation':
      return player.participation;
    case 'status':
      return player.eligible ? (player.pending.length > 0 ? 1 : 2) : 0;
    case 'reasons':
      return player.reasons.length + player.pending.length;
    default:
      return otherSideCount(player, key);
  }
}

interface DivisionTableProps {
  title: string;
  source: ReportSource;
  ownLabel: string;
  /** The club's other sides; empty for a club with one side. */
  otherLabels: string[];
  /** What the player detail needs to account for each round; absent for a CSV report. */
  accounting: RoundAccounting | null;
  schedule: ClubSchedule | null;
  summary: { total: number; eligible: number; onTrack: number };
  visibleCount: number;
  filtered: boolean;
  hiddenColumns: string[];
  onHiddenColumnsChange: (cols: string[]) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  players: PlayerEligibility[];
  /** The side's players before filtering. */
  allPlayers: PlayerEligibility[];
}

function renderCell(player: PlayerEligibility, key: SortKey, source: ReportSource, showCmsId: boolean) {
  switch (key) {
    case 'name':
      return (
        <>
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            {player.name}
          </Typography>
          {source === 'csv' && (
            <Typography variant="caption" color="text.secondary">
              USA ID {player.playerId}
            </Typography>
          )}
          {source === 'record' && showCmsId && (
            <Typography variant="caption" color="text.secondary">
              CMS ID {player.playerId}
            </Typography>
          )}
        </>
      );
    case 'lastRegistered':
      return player.lastRegistered;
    case 'played':
      return player.played;
    case 'sub':
      return player.substitute;
    case 'participation':
      return player.participation;
    case 'status':
      return <EligibilityStatusChip player={player} />;
    case 'reasons':
      return player.reasons.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {player.pending.join(' · ') || '—'}
        </Typography>
      ) : (
        <Typography variant="body2">
          {player.reasons.join(' · ')}
        </Typography>
      );
    default:
      return otherSideCount(player, key);
  }
}

function DivisionTable({
  title,
  source,
  ownLabel,
  otherLabels,
  accounting,
  schedule,
  summary,
  visibleCount,
  filtered,
  hiddenColumns,
  onHiddenColumnsChange,
  statusFilter,
  onStatusFilterChange,
  players,
  allPlayers,
}: DivisionTableProps) {
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'name',
    direction: 'asc',
  });
  const [detail, setDetail] = useState<PlayerEligibility | null>(null);

  // From the whole side, so a filter hiding one of the pair still shows the id.
  const shared = useMemo(() => sharedNames(allPlayers), [allPlayers]);
  const columns = getColumns(otherLabels, source);
  const visibleColumns = columns.filter((col) => !hiddenColumns.includes(col.key));

  const handleSort = (key: SortKey) => {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' },
    );
  };

  const rows = useMemo(
    () =>
      [...players].sort((a, b) =>
        compareValues(sortValue(a, sort.key), sortValue(b, sort.key), sort.direction),
      ),
    [players, sort],
  );

  return (
    <Paper sx={{ p: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="h6" component="h2">
            {title}
          </Typography>
          {filtered && (
            <Typography variant="caption" color="text.secondary">
              Showing {visibleCount} of {summary.total}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={statusFilter}
            onChange={(_, next) => {
              if (next) onStatusFilterChange(next as StatusFilter);
            }}
            aria-label="Eligibility status"
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="eligible">Eligible</ToggleButton>
            <ToggleButton value="ineligible">Ineligible</ToggleButton>
          </ToggleButtonGroup>
          <Chip
            size="small"
            color={summary.eligible === summary.total ? 'success' : summary.total === 0 ? 'default' : 'warning'}
            label={`${summary.eligible} of ${summary.total} eligible${summary.onTrack > 0 ? `, ${summary.onTrack} on track` : ''}`}
          />
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel>Columns</InputLabel>
            <Select
              multiple
              value={columns.filter((col) => !hiddenColumns.includes(col.key)).map((col) => col.key)}
              label="Columns"
              onChange={(event) => {
                const selected = event.target.value as string[];
                onHiddenColumnsChange(
                  columns.map((col) => col.key).filter((key) => !selected.includes(key)),
                );
              }}
              renderValue={(selected) => `Columns (${selected.length})`}
            >
              {columns.map((col) => {
                const locked = col.key === 'name';
                return (
                  <MenuItem key={col.key} value={col.key} disabled={locked}>
                    <Checkbox checked={!hiddenColumns.includes(col.key)} disabled={locked} size="small" />
                    <ListItemText primary={col.title} />
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Box>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {visibleColumns.map((col) => (
                <TableCell key={col.key} align={col.numeric ? 'right' : 'left'}>
                  <TableSortLabel
                    active={sort.key === col.key}
                    direction={sort.key === col.key ? sort.direction : 'asc'}
                    onClick={() => handleSort(col.key)}
                  >
                    {col.title}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((player) => (
              <TableRow
                key={player.playerId}
                hover
                onClick={() => setDetail(player)}
                sx={{ cursor: 'pointer' }}
              >
                {visibleColumns.map((col) => (
                  <TableCell
                    key={col.key}
                    align={col.numeric ? 'right' : 'left'}
                    sx={col.key === 'participation' ? { fontWeight: 'bold' } : undefined}
                  >
                    {renderCell(player, col.key, source, hasSharedName(player, shared))}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} align="center" sx={{ color: 'text.secondary' }}>
                  {filtered
                    ? 'No players match the current filters.'
                    : `No players in this team's report.`}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <PlayerEligibilityDialog
        player={detail}
        source={source}
        ownLabel={ownLabel}
        accounting={accounting}
        schedule={schedule}
        showCmsId={detail !== null && hasSharedName(detail, shared)}
        showHistoryLink
        onClose={() => setDetail(null)}
      />
    </Paper>
  );
}

function reportPlayerLine(player: PlayerEligibility, source: ReportSource, shared: Set<string>): string {
  const shownName =
    source === 'csv'
      ? `${player.name} (#${player.playerId})`
      : hasSharedName(player, shared)
        ? `${player.name} (CMS ID ${player.playerId})`
        : player.name;
  return (
    `${shownName}: ` +
    `played ${player.played} / sub ${player.substitute} ` +
    `(participation ${player.participation})` +
    player.otherSides.map((side) => `, ${side.label} participation ${side.participation}`).join('')
  );
}

/** A gap in the match record, in the words shown on the page and in the export. */
function gapText(gap: ParticipationGap): string {
  const date = new Date(gap.dateTime).toLocaleDateString(undefined, { timeZone: 'UTC' });
  const problem = gap.kind === 'no-lineup' ? 'no lineup recorded' : 'no substitutions recorded';
  return `${gap.teamName} v ${gap.opponent} (${date}): ${problem}`;
}

interface ReportMeta {
  /** Who the report is for, e.g. "Rocky Gorge". */
  title: string;
  source: ReportSource;
  season?: string;
  gaps: ParticipationGap[];
}

function buildReport(breakdown: EligibilityBreakdown, { title, source, season, gaps }: ReportMeta): string {
  const lines: string[] = [];
  lines.push(`${title.toUpperCase()} ELIGIBILITY REPORT`);
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  if (season) lines.push(`Source: match record, ${season} season`);
  lines.push('');
  if (gaps.length > 0) {
    lines.push('RECORD GAPS (counts may be low; check these matches)');
    for (const gap of gaps) {
      lines.push(`  ${gapText(gap)}`);
    }
    lines.push('');
  }

  const sameNames = source === 'record' ? sameNamePlayers(breakdown.sides) : [];
  if (sameNames.length > 0) {
    lines.push('PLAYERS WITH THE SAME NAME (kept separate; counts may be low if one person has two profiles)');
    for (const { name, ids } of sameNames) {
      lines.push(`  ${name}: CMS IDs ${ids.join(', ')}`);
    }
    lines.push('');
  }

  for (const side of breakdown.sides) {
    const shared = sharedNames(side.players);
    const eligible = side.players.filter((p) => p.eligible);
    const ineligible = side.players.filter((p) => !p.eligible);

    lines.push('='.repeat(46));
    lines.push(divisionLabel(side.label, side.teamName, side.summary));
    lines.push('='.repeat(46));
    lines.push('');
    lines.push(`ELIGIBLE (${eligible.length})`);
    if (eligible.length === 0) {
      lines.push('  (none)');
    } else {
      for (const player of eligible) {
        lines.push(`  ${reportPlayerLine(player, source, shared)}`);
        for (const note of player.pending) {
          lines.push(`    • On track: ${note}`);
        }
      }
    }
    lines.push('');
    lines.push(`INELIGIBLE (${ineligible.length})`);
    if (ineligible.length === 0) {
      lines.push('  (none)');
    } else {
      for (const player of ineligible) {
        lines.push(`  ${reportPlayerLine(player, source, shared)}`);
        for (const reason of player.reasons) {
          lines.push(`    • ${reason}`);
        }
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

interface CsvFormProps {
  csvText: string;
  fileName: string;
  canClear: boolean;
  onFile: (event: ChangeEvent<HTMLInputElement>) => void;
  onTextChange: (value: string) => void;
  onRun: () => void;
  onClear: () => void;
}

function CsvForm({ csvText, fileName, canClear, onFile, onTextChange, onRun, onClear }: CsvFormProps) {
  return (
    <>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch', mb: 2, flexWrap: 'wrap' }}>
        <Button variant="outlined" component="label" sx={{ height: 56 }}>
          Choose CSV file…
          <input type="file" accept=".csv,text/csv" hidden onChange={onFile} />
        </Button>
        <TextField
          label="…or paste the CSV"
          multiline
          minRows={6}
          maxRows={14}
          fullWidth
          value={csvText}
          onChange={(event) => onTextChange(event.target.value)}
        />
      </Box>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button variant="contained" onClick={onRun} disabled={!csvText.trim()}>
          Run Breakdown
        </Button>
        <Button variant="text" onClick={onClear} disabled={!canClear}>
          Clear
        </Button>
        {fileName && (
          <Typography variant="body2" color="text.secondary">
            Loaded: {fileName}
          </Typography>
        )}
      </Box>
    </>
  );
}

export default function EligibilityPage() {
  const [source, setSource] = useState<ReportSource>('record');
  const [clubName, setClubName] = useState('');
  const [fileName, setFileName] = useState('');
  const [csvText, setCsvText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [csvRows, setCsvRows] = useState<PlayerRow[] | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [hiddenColumns, setHiddenColumns] = useState<string[]>(['lastRegistered', 'played', 'sub']);

  const schedule = useQuery({
    queryKey: ['eligibility-fixtures'],
    queryFn: loadCurrentSeasonFixtures,
  });
  const fixtures = schedule.data;
  const clubs = useMemo(() => (fixtures ? listClubs(fixtures, eligibility) : []), [fixtures]);
  const csvClubs = useMemo(() => (csvRows ? clubsInRows(csvRows) : []), [csvRows]);
  const pickableClubs = source === 'record' ? clubs : csvClubs;
  // Defaults to this site's own club.
  const club =
    pickableClubs.find((candidate) => candidate.name === clubName) ??
    pickableClubs.find((candidate) => candidate.name === DEFAULT_CLUB) ??
    pickableClubs[0] ??
    null;
  const record = useQuery({
    queryKey: ['eligibility-record', club?.name],
    queryFn: () =>
      loadClubRecord(club as NonNullable<typeof club>, {
        live: LIVE_RECORD,
        fixtures: fixtures ?? [],
        fetchMatch: fetchMatchCentre,
        loadSaved: loadParticipationSnapshot,
      }),
    enabled: source === 'record' && club !== null,
    staleTime: LIVE_RECORD_STALE_MS,
    retry: false,
  });
  const clubRecord = record.data ?? null;
  const clubSlug = (club && clubPages[club.name]?.slug) || null;
  const snapshot = clubRecord?.snapshot ?? null;

  const breakdown = useMemo(() => {
    if (!club) return null;
    const remaining = remainingMatches(fixtures ?? [], club, eligibility);
    if (source === 'csv') {
      return csvRows && computeBreakdown(csvRows, club.sides, eligibility, remaining);
    }
    return snapshot
      ? computeBreakdown(participationRows(snapshot, club, eligibility), club.sides, eligibility, remaining)
      : null;
  }, [source, club, csvRows, snapshot, fixtures]);
  const gaps = useMemo(
    () => (source === 'record' && snapshot && club ? clubGaps(snapshot, club, eligibility) : []),
    [source, snapshot, club],
  );
  const oneSide = club?.sides.length === 1;
  const sameNames = source === 'record' && breakdown ? sameNamePlayers(breakdown.sides) : [];
  const accounting: RoundAccounting | null =
    source === 'record' && snapshot && club
      ? { snapshot, fixtures: fixtures ?? [], clubSlug, sides: club.sides.map((side) => side.teamName) }
      : null;
  const clubSchedule: ClubSchedule | null = club ? { club, fixtures: fixtures ?? [], clubSlug } : null;
  const clubFixturesUrl = fixturesUrl(clubSlug);
  const activeSide = breakdown?.sides[Math.min(activeTab, breakdown.sides.length - 1)] ?? null;

  const matchesFilters = (player: PlayerEligibility) => {
    if (statusFilter === 'eligible' && !player.eligible) return false;
    if (statusFilter === 'ineligible' && player.eligible) return false;
    return true;
  };

  const visiblePlayers = activeSide ? activeSide.players.filter(matchesFilters) : [];
  const filtersActive = statusFilter !== 'all';

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(String(reader.result ?? ''));
      setFileName(file.name);
      setError(null);
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleRun = () => {
    setError(null);
    try {
      setCsvRows(parsePlayerRows(csvText));
      setDialogOpen(false);
    } catch (err) {
      setCsvRows(null);
      setError(err instanceof Error ? err.message : 'Could not read the CSV.');
      setDialogOpen(false);
    }
  };

  const handleClear = () => {
    setCsvText('');
    setFileName('');
    setError(null);
    setCsvRows(null);
    setStatusFilter('all');
    setHiddenColumns(['lastRegistered', 'played', 'sub']);
    setDialogOpen(false);
  };

  const handleExport = () => {
    if (!breakdown) return;
    const meta: ReportMeta = {
      title: club?.name ?? 'Club',
      source,
      season: source === 'record' ? snapshot?.season : undefined,
      gaps,
    };
    const blob = new Blob([buildReport(breakdown, meta)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `eligibility-report-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Eligibility Breakdown
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2, maxWidth: 800 }}>
        {source === 'record'
          ? `Pick a club to see which players are NCS-eligible, from the league and
             local playoff lineups in the match record; Super Regionals, National
             Championships and 7s don't count. Participation counts starts and
             substitute appearances; a listed player who never enters the game doesn't
             count. Fixtures still to play before Super Regionals count towards the
             two-match minimums, shown as on track. On track is experimental, because future playoff matches aren't always entered in Rugby Xplorer. Men's Division IV, Women's Division III and crossover matches don't count. Click a player to check their
             count round by round against the Rugby Xplorer match reports. This is a guide: the Rugby Xplorer report is
             the official count, and the record has no registration data, so check registration separately.`
          : `Paste or upload the Rugby Xplorer matches-played report for any club to see
             which players are NCS-eligible for each of its sides.
             Participation counts as Played + Substitute; per-round attendance codes
             do not count. Fixtures still to play before Super Regionals count towards
             the two-match minimums, shown as on track. Players are assumed registered — the report only lists
             registered players — and the registration date is shown for reference.`}{' '}
        <MuiLink component={Link} href="/utils/eligibility-methodology">
          How this report is worked out
        </MuiLink>
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 3 }}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={source}
          onChange={(_, next) => {
            if (next) setSource(next as ReportSource);
          }}
          aria-label="Report source"
        >
          <ToggleButton value="record">Match record</ToggleButton>
          <ToggleButton value="csv">CSV report</ToggleButton>
        </ToggleButtonGroup>
        {club && (
          <>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="eligibility-club-label">Club</InputLabel>
              <Select
                labelId="eligibility-club-label"
                label="Club"
                value={club.name}
                onChange={(event) => {
                  setClubName(event.target.value);
                  setActiveTab(0);
                }}
              >
                {pickableClubs.map((candidate) => (
                  <MenuItem key={candidate.name} value={candidate.name}>
                    {candidate.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {source === 'record' && clubRecord && (
              <Typography variant="body2" color="text.secondary">
                {clubRecord.snapshot.season} season ·{' '}
                {clubRecord.source === 'live' ? 'Live data' : 'Saved data'}
                {clubRecord.asOf && ` from ${new Date(clubRecord.asOf).toLocaleString()}`}
              </Typography>
            )}
            <MuiLink
              variant="body2"
              href={clubFixturesUrl ?? RUGBY_XPLORER_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {clubFixturesUrl
                ? `${club.name} fixtures on Rugby Xplorer`
                : 'Find this club on Rugby Xplorer'}
            </MuiLink>
          </>
        )}
      </Box>

      {source === 'record' && (schedule.isPending || (club && record.isPending)) && (
        <Typography color="text.secondary">Loading the match record…</Typography>
      )}

      {source === 'record' && (schedule.isError || record.isError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Could not load the match record
          {record.error ? `: ${record.error.message}` : '.'} Try again, or use a CSV report.
        </Alert>
      )}

      {source === 'record' && clubRecord?.liveFailed && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          The live pull failed, so this report uses saved data and may miss recent matches.
        </Alert>
      )}

      {source === 'record' && schedule.isSuccess && clubs.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          The fixture list has no clubs yet. Use a CSV report instead.
        </Alert>
      )}

      {oneSide && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Only one of this club&apos;s sides is in the data, so it is assessed as a one-side club:
          two qualifying matches, and no other side to compare.
        </Typography>
      )}

      {gaps.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          These matches have gaps in the record, so some counts may be low. Check them
          before relying on a verdict:
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
            {gaps.map((gap) => (
              <li key={`${gap.fixtureId}-${gap.teamName}`}>{gapText(gap)}</li>
            ))}
          </Box>
        </Alert>
      )}

      {sameNames.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          These players share a name, so they are kept separate. If one person has two Rugby
          Xplorer profiles, their matches stay split until the profiles are merged, and each count
          may be low:
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
            {sameNames.map(({ name, ids }) => (
              <li key={name}>
                {name}: CMS IDs {ids.join(', ')}
              </li>
            ))}
          </Box>
        </Alert>
      )}

      {source === 'csv' && !breakdown && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <CsvForm
            csvText={csvText}
            fileName={fileName}
            canClear={Boolean(csvText)}
            onFile={handleFile}
            onTextChange={(value) => {
              setCsvText(value);
              setFileName('');
            }}
            onRun={handleRun}
            onClear={handleClear}
          />
        </Paper>
      )}

      {source === 'csv' && error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {breakdown && breakdown.ignoredTeamNames.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Ignored {breakdown.ignoredTeamNames.length} row(s) for team(s) not in
          the eligibility config: {breakdown.ignoredTeamNames.join(', ')}.
        </Alert>
      )}

      {source === 'csv' && !breakdown && !error && (
        <Typography color="text.secondary">
          Upload a report and run the breakdown to see player eligibility.
        </Typography>
      )}

      {breakdown && (
        <>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              mb: 2,
            }}
          >
            {oneSide ? (
              <Box />
            ) : (
              <Tabs
                value={Math.min(activeTab, breakdown.sides.length - 1)}
                onChange={(_, newValue) => setActiveTab(newValue)}
                aria-label="Eligibility by division"
                variant="scrollable"
                scrollButtons="auto"
              >
                {breakdown.sides.map((side) => (
                  <Tab key={side.teamName} label={`${side.label} side`} />
                ))}
              </Tabs>
            )}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {source === 'csv' && (
                <Button variant="outlined" size="small" onClick={() => setDialogOpen(true)}>
                  Edit Report Data
                </Button>
              )}
              <Button variant="outlined" size="small" onClick={handleExport}>
                Export Report
              </Button>
            </Box>
          </Box>
          {activeSide && (
            <DivisionTable
              title={divisionLabel(activeSide.label, activeSide.teamName, activeSide.summary)}
              source={source}
              ownLabel={activeSide.label}
              otherLabels={breakdown.sides
                .filter((side) => side.teamName !== activeSide.teamName)
                .map((side) => side.label)}
              accounting={accounting}
              schedule={clubSchedule}
              summary={activeSide.summary}
              visibleCount={visiblePlayers.length}
              filtered={filtersActive}
              hiddenColumns={hiddenColumns}
              onHiddenColumnsChange={setHiddenColumns}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              players={visiblePlayers}
              allPlayers={activeSide.players}
            />
          )}
        </>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Report Data</DialogTitle>
        <DialogContent dividers sx={{ pt: 3 }}>
          <CsvForm
            csvText={csvText}
            fileName={fileName}
            canClear={Boolean(csvText) || Boolean(csvRows)}
            onFile={handleFile}
            onTextChange={(value) => {
              setCsvText(value);
              setFileName('');
            }}
            onRun={handleRun}
            onClear={handleClear}
          />
        </DialogContent>
      </Dialog>
    </Container>
  );
}