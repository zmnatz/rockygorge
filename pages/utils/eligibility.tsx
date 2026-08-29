import { useMemo, useState, type ChangeEvent } from 'react';
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
} from '@mui/material';
import { computeBreakdown, parsePlayerRows } from '@/utils/eligibility';
import { compareValues, type SortDirection } from '@/utils/sort';
import eligibility from '@config/eligibility.yml';

import type { EligibilityBreakdown, PlayerEligibility } from '@/types/eligibility';

const UPPER_LABEL = eligibility.upperDivision.label;
const LOWER_LABEL = eligibility.lowerDivision.label;

type StatusFilter = 'all' | 'eligible' | 'ineligible';

function statusChip(eligible: boolean) {
  return <Chip size="small" color={eligible ? 'success' : 'error'} label={eligible ? 'ELIGIBLE' : 'INELIGIBLE'} />;
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

const getColumns = (otherLabel: string): { key: SortKey; title: string; numeric?: boolean }[] => [
  { key: 'name', title: 'Player' },
  { key: 'lastRegistered', title: 'Last Registered' },
  { key: 'played', title: 'Played', numeric: true },
  { key: 'sub', title: 'Sub', numeric: true },
  { key: 'participation', title: 'Participation', numeric: true },
  { key: 'otherDivision', title: `${otherLabel} Appearances`, numeric: true },
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
      return player.eligible ? 1 : 0;
    case 'reasons':
      return player.reasons.length;
  }
}

interface DivisionTableProps {
  title: string;
  otherLabel: string;
  summary: { total: number; eligible: number };
  visibleCount: number;
  filtered: boolean;
  hiddenColumns: string[];
  onHiddenColumnsChange: (cols: string[]) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  players: PlayerEligibility[];
}

function renderCell(player: PlayerEligibility, key: SortKey) {
  switch (key) {
    case 'name':
      return (
        <>
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            {player.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            USA ID {player.usaId}
          </Typography>
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
      return statusChip(player.eligible);
    case 'reasons':
      return player.eligible ? (
        <Typography variant="body2" color="text.secondary">
          —
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

  const columns = getColumns(otherLabel);
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
            label={`${summary.eligible} of ${summary.total} eligible`}
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
              <TableRow key={player.usaId}>
                {visibleColumns.map((col) => (
                  <TableCell
                    key={col.key}
                    align={col.numeric ? 'right' : 'left'}
                    sx={col.key === 'participation' ? { fontWeight: 'bold' } : undefined}
                  >
                    {renderCell(player, col.key)}
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
    </Paper>
  );
}

export default function EligibilityPage() {
  const [fileName, setFileName] = useState('');
  const [csvText, setCsvText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<EligibilityBreakdown | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [hiddenColumns, setHiddenColumns] = useState<string[]>(['lastRegistered']);

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
      const rows = parsePlayerRows(csvText);
      setBreakdown(computeBreakdown(rows, eligibility));
    } catch (err) {
      setBreakdown(null);
      setError(err instanceof Error ? err.message : 'Could not read the CSV.');
    }
  };

  const handleClear = () => {
    setCsvText('');
    setFileName('');
    setError(null);
    setBreakdown(null);
    setStatusFilter('all');
    setHiddenColumns(['lastRegistered']);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Eligibility Breakdown
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 800 }}>
        Paste or upload the Rugby Xplorer matches-played report to see which
        players are NCS-eligible for the {UPPER_LABEL} and {LOWER_LABEL} sides.
        Participation counts as Played + Substitute; Reserve and per-round
        attendance do not. Players are assumed registered — the report only
        lists registered players — and the registration date is shown for
        reference.
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch', mb: 2, flexWrap: 'wrap' }}>
          <Button variant="outlined" component="label" sx={{ height: 56 }}>
            Choose CSV file…
            <input type="file" accept=".csv,text/csv" hidden onChange={handleFile} />
          </Button>
          <TextField
            label="…or paste the CSV"
            multiline
            minRows={6}
            maxRows={14}
            fullWidth
            value={csvText}
            onChange={(event) => {
              setCsvText(event.target.value);
              setFileName('');
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button variant="contained" onClick={handleRun} disabled={!csvText.trim()}>
            Run Breakdown
          </Button>
          <Button variant="text" onClick={handleClear} disabled={!csvText && !breakdown}>
            Clear
          </Button>
          {fileName && (
            <Typography variant="body2" color="text.secondary">
              Loaded: {fileName}
            </Typography>
          )}
        </Box>
      </Paper>

      {error && (
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

      {!breakdown && !error && (
        <Typography color="text.secondary">
          Upload a report and run the breakdown to see player eligibility.
        </Typography>
      )}

      {breakdown && (
        <>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{ mb: 2 }}
            aria-label="Eligibility by division"
          >
            <Tab label={`${UPPER_LABEL} side`} />
            <Tab label={`${LOWER_LABEL} side`} />
          </Tabs>
          {activeTab === 0 && (
            <DivisionTable
              title={
                breakdown.upper[0]
                  ? `${UPPER_LABEL} side — ${breakdown.upper[0].competition}`
                  : `${UPPER_LABEL} side`
              }
              otherLabel={LOWER_LABEL}
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
              title={
                breakdown.lower[0]
                  ? `${LOWER_LABEL} side — ${breakdown.lower[0].competition}`
                  : `${LOWER_LABEL} side`
              }
              otherLabel={UPPER_LABEL}
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
    </Container>
  );
}