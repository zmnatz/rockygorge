import { useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
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
import { computeBreakdown, divisionLabel, parsePlayerRows } from '@/utils/eligibility';
import {
  clubConfig,
  clubGaps,
  listClubs,
  loadClubRecord,
  loadParticipationSnapshot,
  participationRows,
  remainingMatches,
  type ParticipationGap,
} from '@/utils/participation';
import { fetchMatchCentre } from '@/utils/playerHistory';
import { compareValues, type SortDirection } from '@/utils/sort';
import eligibility from '@config/eligibility.yml';

import type {
  EligibilityBreakdown,
  EligibilityConfig,
  PlayerEligibility,
  PlayerRow,
} from '@/types/eligibility';

/** Where a report's rows came from. Only a CSV report carries USA IDs and
 *  registration dates. */
type ReportSource = 'record' | 'csv';

// Deployed pages pull live; dev uses the saved snapshot so working on the page
// doesn't hit the CMS.
const LIVE_RECORD = process.env.NODE_ENV === 'production';
const LIVE_RECORD_STALE_MS = 10 * 60 * 1000;

type StatusFilter = 'all' | 'eligible' | 'ineligible';

function statusChip(player: PlayerEligibility) {
  if (!player.eligible) return <Chip size="small" color="error" label="INELIGIBLE" />;
  return player.pending.length > 0 ? (
    <Chip size="small" color="warning" label="ON TRACK" />
  ) : (
    <Chip size="small" color="success" label="ELIGIBLE" />
  );
}

type SortKey =
  | 'name'
  | 'lastRegistered'
  | 'played'
  | 'sub'
  | 'participation'
  | 'otherDivision'
  | 'status'
  | 'reasons';

const getColumns = (
  otherLabel: string,
  source: ReportSource,
): { key: SortKey; title: string; numeric?: boolean }[] => [
  { key: 'name', title: 'Player' },
  ...(source === 'csv' ? [{ key: 'lastRegistered' as const, title: 'Last Registered' }] : []),
  { key: 'played', title: 'Played', numeric: true },
  { key: 'sub', title: 'Sub', numeric: true },
  { key: 'participation', title: 'Participation', numeric: true },
  { key: 'otherDivision', title: `${otherLabel} Participation`, numeric: true },
  { key: 'status', title: 'Status' },
  { key: 'reasons', title: 'Reason' },
];

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
    case 'otherDivision':
      return player.otherDivisionParticipation;
    case 'status':
      return player.eligible ? (player.pending.length > 0 ? 1 : 2) : 0;
    case 'reasons':
      return player.reasons.length + player.pending.length;
  }
}

interface DivisionTableProps {
  title: string;
  source: ReportSource;
  ownLabel: string;
  otherLabel: string;
  summary: { total: number; eligible: number; onTrack: number };
  visibleCount: number;
  filtered: boolean;
  hiddenColumns: string[];
  onHiddenColumnsChange: (cols: string[]) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  players: PlayerEligibility[];
}

function renderCell(player: PlayerEligibility, key: SortKey, source: ReportSource) {
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
    case 'otherDivision':
      return player.otherDivisionParticipation;
    case 'status':
      return statusChip(player);
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
  }
}

function DivisionTable({
  title,
  source,
  ownLabel,
  otherLabel,
  summary,
  visibleCount,
  filtered,
  hiddenColumns,
  onHiddenColumnsChange,
  statusFilter,
  onStatusFilterChange,
  players,
}: DivisionTableProps) {
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'name',
    direction: 'asc',
  });
  const [detail, setDetail] = useState<PlayerEligibility | null>(null);

  const columns = getColumns(otherLabel, source);
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
                    {renderCell(player, col.key, source)}
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
      <PlayerDetailsDialog
        player={detail}
        source={source}
        ownLabel={ownLabel}
        onClose={() => setDetail(null)}
      />
    </Paper>
  );
}

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

/** Full report detail for one player, opened by clicking a table row. */
function PlayerDetailsDialog({
  player,
  source,
  ownLabel,
  onClose,
}: {
  player: PlayerEligibility | null;
  source: ReportSource;
  ownLabel: string;
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
              {statusChip(player)}
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
              <Fact label="Other-division participation" value={player.otherDivisionParticipation} />
            </Box>
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
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}

function reportPlayerLine(player: PlayerEligibility, otherLabel: string, source: ReportSource): string {
  return (
    `${source === 'csv' ? `${player.name} (#${player.playerId})` : player.name}: ` +
    `played ${player.played} / sub ${player.substitute} ` +
    `(participation ${player.participation}), ${otherLabel} participation ${player.otherDivisionParticipation}`
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

function buildReport(
  breakdown: EligibilityBreakdown,
  config: EligibilityConfig,
  { title, source, season, gaps }: ReportMeta,
): string {
  const sections = [
    {
      heading: divisionLabel(config.upperDivision.label, config.upperDivision.teamName, breakdown.upperSummary),
      otherLabel: config.lowerDivision.label,
      players: breakdown.upper,
    },
    {
      heading: divisionLabel(config.lowerDivision.label, config.lowerDivision.teamName, breakdown.lowerSummary),
      otherLabel: config.upperDivision.label,
      players: breakdown.lower,
    },
  ];

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

  for (const section of sections) {
    const eligible = section.players.filter((p) => p.eligible);
    const ineligible = section.players.filter((p) => !p.eligible);

    lines.push('='.repeat(46));
    lines.push(section.heading);
    lines.push('='.repeat(46));
    lines.push('');
    lines.push(`ELIGIBLE (${eligible.length})`);
    if (eligible.length === 0) {
      lines.push('  (none)');
    } else {
      for (const player of eligible) {
        lines.push(`  ${reportPlayerLine(player, section.otherLabel, source)}`);
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
        lines.push(`  ${reportPlayerLine(player, section.otherLabel, source)}`);
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
  // Defaults to the configured club, this site's own.
  const club =
    clubs.find((candidate) => candidate.name === clubName) ??
    clubs.find((candidate) => candidate.upperTeam === eligibility.upperDivision.teamName) ??
    clubs[0] ??
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
  const snapshot = clubRecord?.snapshot ?? null;
  const recordReport = useMemo(() => {
    if (!snapshot || !club) return null;
    const config = clubConfig(club, eligibility);
    return {
      config,
      breakdown: computeBreakdown(
        participationRows(snapshot, club, config),
        config,
        remainingMatches(fixtures ?? [], club, config),
      ),
      gaps: clubGaps(snapshot, club, config),
    };
  }, [snapshot, club, fixtures]);

  const csvBreakdown = useMemo(
    () =>
      csvRows &&
      computeBreakdown(
        csvRows,
        eligibility,
        remainingMatches(
          fixtures ?? [],
          {
            upperTeam: eligibility.upperDivision.teamName,
            lowerTeam: eligibility.lowerDivision.teamName,
          },
          eligibility,
        ),
      ),
    [csvRows, fixtures],
  );

  const breakdown = source === 'record' ? (recordReport?.breakdown ?? null) : csvBreakdown;
  const config = source === 'record' ? (recordReport?.config ?? eligibility) : eligibility;
  const gaps = source === 'record' ? (recordReport?.gaps ?? []) : [];
  const upperLabel = config.upperDivision.label;
  const lowerLabel = config.lowerDivision.label;

  const matchesFilters = (player: PlayerEligibility) => {
    if (statusFilter === 'eligible' && !player.eligible) return false;
    if (statusFilter === 'ineligible' && player.eligible) return false;
    return true;
  };

  const upperPlayers = breakdown ? breakdown.upper.filter(matchesFilters) : [];
  const lowerPlayers = breakdown ? breakdown.lower.filter(matchesFilters) : [];
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
    const meta: ReportMeta =
      source === 'record' && club && snapshot
        ? { title: club.name, source, season: snapshot.season, gaps }
        : { title: 'Rocky Gorge', source, gaps };
    const blob = new Blob([buildReport(breakdown, config, meta)], { type: 'text/plain;charset=utf-8' });
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
             two-match minimums, shown as on track. Lists clubs with two sides. This is a guide: the Rugby Xplorer report is the official count,
             and the record has no registration data, so check registration separately.`
          : `Paste or upload the Rugby Xplorer matches-played report to see which
             players are NCS-eligible for the ${upperLabel} and ${lowerLabel} sides.
             Participation counts as Played + Substitute; per-round attendance codes
             do not count. Fixtures still to play before Super Regionals count towards
             the two-match minimums, shown as on track. Players are assumed registered — the report only lists
             registered players — and the registration date is shown for reference.`}
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
        {source === 'record' && club && (
          <>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="eligibility-club-label">Club</InputLabel>
              <Select
                labelId="eligibility-club-label"
                label="Club"
                value={club.name}
                onChange={(event) => setClubName(event.target.value)}
              >
                {clubs.map((candidate) => (
                  <MenuItem key={candidate.name} value={candidate.name}>
                    {candidate.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {clubRecord && (
              <Typography variant="body2" color="text.secondary">
                {clubRecord.snapshot.season} season ·{' '}
                {clubRecord.source === 'live' ? 'Live data' : 'Saved data'}
                {clubRecord.asOf && ` from ${new Date(clubRecord.asOf).toLocaleString()}`}
              </Typography>
            )}
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

      {source === 'record' && schedule.isSuccess && !club && (
        <Alert severity="info" sx={{ mb: 3 }}>
          The fixture list has no clubs with two sides yet. Use a CSV report instead.
        </Alert>
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
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              aria-label="Eligibility by division"
            >
              <Tab label={`${upperLabel} side`} />
              <Tab label={`${lowerLabel} side`} />
            </Tabs>
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
          {activeTab === 0 && (
            <DivisionTable
              title={divisionLabel(upperLabel, config.upperDivision.teamName, breakdown.upperSummary)}
              source={source}
              ownLabel={upperLabel}
              otherLabel={lowerLabel}
              summary={breakdown.upperSummary}
              visibleCount={upperPlayers.length}
              filtered={filtersActive}
              hiddenColumns={hiddenColumns}
              onHiddenColumnsChange={setHiddenColumns}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              players={upperPlayers}
            />
          )}
          {activeTab === 1 && (
            <DivisionTable
              title={divisionLabel(lowerLabel, config.lowerDivision.teamName, breakdown.lowerSummary)}
              source={source}
              ownLabel={lowerLabel}
              otherLabel={upperLabel}
              summary={breakdown.lowerSummary}
              visibleCount={lowerPlayers.length}
              filtered={filtersActive}
              hiddenColumns={hiddenColumns}
              onHiddenColumnsChange={setHiddenColumns}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              players={lowerPlayers}
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