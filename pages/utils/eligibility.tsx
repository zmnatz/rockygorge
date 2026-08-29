import { useState, type ChangeEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { computeBreakdown, parsePlayerRows } from '@/utils/eligibility';
import eligibility from '@config/eligibility.yml';

import type { EligibilityBreakdown, PlayerEligibility } from '@/types/eligibility';

const UPPER_LABEL = eligibility.upperDivision.label;
const LOWER_LABEL = eligibility.lowerDivision.label;

function statusChip(eligible: boolean) {
  return <Chip size="small" color={eligible ? 'success' : 'error'} label={eligible ? 'ELIGIBLE' : 'INELIGIBLE'} />;
}

interface DivisionTableProps {
  title: string;
  summary: { total: number; eligible: number };
  players: PlayerEligibility[];
}

function DivisionTable({ title, summary, players }: DivisionTableProps) {
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
        <Chip
          size="small"
          color={summary.eligible === summary.total ? 'success' : summary.total === 0 ? 'default' : 'warning'}
          label={`${summary.eligible} of ${summary.total} eligible`}
        />
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Player</TableCell>
              <TableCell>Last Registered</TableCell>
              <TableCell>Played / Sub</TableCell>
              <TableCell align="right">Participation</TableCell>
              <TableCell align="right">Other Div</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Reason</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {players.map((player) => (
              <TableRow key={player.usaId}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {player.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    USA ID {player.usaId}
                  </Typography>
                </TableCell>
                <TableCell>{player.lastRegistered}</TableCell>
                <TableCell>
                  {player.played} / {player.substitute}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  {player.participation}
                </TableCell>
                <TableCell align="right">{player.otherDivisionParticipation}</TableCell>
                <TableCell>{statusChip(player.eligible)}</TableCell>
                <TableCell>
                  {player.eligible ? (
                    <Typography variant="body2" color="text.secondary">
                      —
                    </Typography>
                  ) : (
                    <Typography variant="body2">
                      {player.reasons.join(' · ')}
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {players.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ color: 'text.secondary' }}>
                  No players in this team&apos;s report.
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
              summary={breakdown.upperSummary}
              players={breakdown.upper}
            />
          )}
          {activeTab === 1 && (
            <DivisionTable
              title={
                breakdown.lower[0]
                  ? `${LOWER_LABEL} side — ${breakdown.lower[0].competition}`
                  : `${LOWER_LABEL} side`
              }
              summary={breakdown.lowerSummary}
              players={breakdown.lower}
            />
          )}
        </>
      )}
    </Container>
  );
}