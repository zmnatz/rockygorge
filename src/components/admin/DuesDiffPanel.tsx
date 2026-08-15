import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Link,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useRequireAuth } from '@/components/RequireAuth';
import { post } from '@/utils/api';
import {
  computeDuesDiff,
  computeSupporterDiff,
  type DuesDiffEntry,
} from '@/utils/dues-diff';
import type { Dues } from '@/types/data';
import type { PaypalTransaction } from '@/types/paypal';

interface DuesDiffPanelProps {
  /** The transactions currently attributed to the dues item. */
  transactions: PaypalTransaction[];
  /** The current Dues Record from content/admin/dues.yaml. */
  existingDues: Dues[];
  /** The current Supporters List from the supporters Store Item. */
  existingSupporters: string[];
}

type Destination = 'dues' | 'supporters';

type CommitStatus = 'idle' | 'submitting' | 'success' | 'error';

export function DuesDiffPanel({
  transactions,
  existingDues,
  existingSupporters,
}: DuesDiffPanelProps) {
  const { getAccessToken } = useRequireAuth();
  const [destination, setDestination] = useState<Destination>('dues');

  const candidates = useMemo(
    () =>
      destination === 'dues'
        ? computeDuesDiff(transactions, existingDues)
        : computeSupporterDiff(transactions, existingSupporters),
    [transactions, existingDues, existingSupporters, destination],
  );

  const [entries, setEntries] = useState<DuesDiffEntry[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<CommitStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [prUrl, setPrUrl] = useState('');

  useEffect(() => {
    setEntries(candidates);
    setSelected(Object.fromEntries(candidates.map((entry) => [entry.name, true])));
    setStatus('idle');
    setErrorMessage('');
    setPrUrl('');
  }, [candidates]);

  const selectedCount = entries.filter((entry) => selected[entry.name]).length;
  const rollLabel = destination === 'dues' ? 'Dues Record' : 'Supporters List';

  const toggleSelect = (name: string, checked: boolean) => {
    setSelected((prev) => ({ ...prev, [name]: checked }));
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelected(Object.fromEntries(entries.map((entry) => [entry.name, checked])));
  };

  const toggleMonthly = (name: string) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.name === name ? { ...entry, monthly: !entry.monthly } : entry,
      ),
    );
  };

  const handleCommit = async () => {
    const toCommit = entries.filter((entry) => selected[entry.name]);
    if (toCommit.length === 0 || status === 'submitting') return;
    setStatus('submitting');
    setErrorMessage('');
    try {
      const accessToken = await getAccessToken();
      if (destination === 'dues') {
        const result = await post<{ message: string; prUrl?: string }>(
          '/.netlify/functions/admin-dues',
          {
            newEntries: toCommit.map(({ name, date, monthly }) => ({ name, date, monthly })),
          },
          accessToken,
        );
        setPrUrl(result.prUrl ?? '');
      } else {
        const result = await post<{ message: string; prUrl?: string }>(
          '/.netlify/functions/admin-supporters',
          { names: toCommit.map((entry) => entry.name) },
          accessToken,
        );
        setPrUrl(result.prUrl ?? '');
      }
      const committedNames = new Set(toCommit.map((entry) => entry.name));
      setEntries((prev) => prev.filter((entry) => !committedNames.has(entry.name)));
      setSelected((prev) => {
        const next = { ...prev };
        for (const name of committedNames) next[name] = false;
        return next;
      });
      setStatus('success');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to commit the dues update.',
      );
      setStatus('error');
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 4 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Update Dues Record
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        New settled payments in the selected range that aren&apos;t in the chosen
        roll yet. Pick the entries to add and commit; the change is pushed to a
        branch and opened as a pull request.
      </Typography>

      <TextField
        select
        label="Commit to"
        value={destination}
        onChange={(event) => setDestination(event.target.value as Destination)}
        sx={{ mb: 2, maxWidth: 360, minWidth: 240 }}
      >
        <MenuItem value="dues">Dues Record</MenuItem>
        <MenuItem value="supporters">Supporters List</MenuItem>
      </TextField>

      {transactions.length === 0 ? (
        <Typography color="text.secondary">
          Run the report to see new payments. Any settled payment in the selected
          range that isn&apos;t already in the chosen roll appears below.
        </Typography>
      ) : entries.length === 0 ? (
        <Typography color="text.secondary">
          No new {destination === 'dues' ? 'members' : 'supporters'} detected.
          Everyone in the selected range is already in the {rollLabel}.
        </Typography>
      ) : (
        <>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedCount === entries.length}
                      indeterminate={selectedCount > 0 && selectedCount < entries.length}
                      onChange={(event) => toggleSelectAll(event.target.checked)}
                      slotProps={{ input: { 'aria-label': 'Select all entries' } }}
                    />
                  </TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Item</TableCell>
                  <TableCell>Amount</TableCell>
                  {destination === 'dues' && <TableCell>Monthly</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.name}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={!!selected[entry.name]}
                        onChange={(event) => toggleSelect(entry.name, event.target.checked)}
                        slotProps={{ input: { 'aria-label': `Select ${entry.name}` } }}
                      />
                    </TableCell>
                    <TableCell>{entry.name}</TableCell>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell>{entry.itemTitle}</TableCell>
                    <TableCell>${entry.amount.toFixed(2)}</TableCell>
                    {destination === 'dues' && (
                      <TableCell>
                        <Checkbox
                          checked={entry.monthly}
                          onChange={() => toggleMonthly(entry.name)}
                          disabled={!selected[entry.name]}
                          slotProps={{ input: { 'aria-label': `Monthly for ${entry.name}` } }}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCommit}
              disabled={selectedCount === 0 || status === 'submitting'}
            >
              {status === 'submitting'
                ? 'Committing...'
                : `Commit ${selectedCount} to ${rollLabel}`}
            </Button>
            {status === 'submitting' && <CircularProgress size={20} />}
          </Box>

          {status === 'success' && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Committed {selectedCount} entries to the {rollLabel}.{' '}
              {prUrl && (
                <Link href={prUrl} target="_blank" rel="noreferrer">
                  View the pull request
                </Link>
              )}
            </Alert>
          )}
          {status === 'error' && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errorMessage}
            </Alert>
          )}
        </>
      )}
    </Paper>
  );
}
