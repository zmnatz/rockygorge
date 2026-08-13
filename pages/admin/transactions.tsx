import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from '@mui/material';
import { RequireAuth, useRequireAuth } from '@/components/RequireAuth';
import { useTransactions } from '@/api/transactions';
import { downloadCsv, toCsv } from '@/utils/csv';
import { MAX_RANGE_DAYS, countDays } from '@/utils/date-range';
import type { DateRange } from '@/types/date-range';
import type { PaypalTransaction } from '@/types/paypal';

interface TransactionColumn {
  key: keyof PaypalTransaction;
  label: string;
  numeric?: boolean;
}

const COLUMNS: TransactionColumn[] = [
  { key: 'date', label: 'Date' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'itemTitle', label: 'Item Title' },
  { key: 'gross', label: 'Gross', numeric: true },
  { key: 'fee', label: 'Fee', numeric: true },
  { key: 'net', label: 'Net', numeric: true },
  { key: 'txnId', label: 'Txn ID' },
];

/** Columns that default to newest/largest-first when first sorted. */
const DEFAULT_DESC_KEYS = new Set<keyof PaypalTransaction>(['date', 'net']);

function toDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function defaultDateRange(): DateRange {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 30);
  return { start: toDateInput(start), end: toDateInput(end) };
}

interface SortState {
  key: keyof PaypalTransaction;
  direction: 'asc' | 'desc';
}

/** Render a cell's value; money columns are fixed to two decimal places. */
function formatCell(txn: PaypalTransaction, col: TransactionColumn): string {
  return col.numeric ? (txn[col.key] as number).toFixed(2) : String(txn[col.key]);
}

export default function AdminTransactionsPage() {
  return (
    <RequireAuth>
      <TransactionsReport />
    </RequireAuth>
  );
}

function TransactionsReport() {
  const { getAccessToken } = useRequireAuth();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [range, setRange] = useState<DateRange | null>(null);
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState<SortState>({ key: 'date', direction: 'desc' });

  useEffect(() => {
    const defaults = defaultDateRange();
    setStart(defaults.start);
    setEnd(defaults.end);
  }, []);

  const { data = [], isPending, isFetching, error } = useTransactions(
    range ?? { start: '', end: '' },
    getAccessToken,
  );

  const rangeError = useMemo(() => {
    if (!start || !end) return '';
    return countDays({ start, end }) > MAX_RANGE_DAYS
      ? `Date range may not exceed ${MAX_RANGE_DAYS} days.`
      : '';
  }, [start, end]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!start || !end || rangeError) return;
    setRange({ start, end });
  };

  const visible = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return data;
    return data.filter(
      (txn) =>
        txn.name.toLowerCase().includes(query) ||
        txn.email.toLowerCase().includes(query) ||
        txn.itemTitle.toLowerCase().includes(query),
    );
  }, [data, filter]);

  const sorted = useMemo(() => {
    const { key, direction } = sort;
    return [...visible].sort((a, b) => {
      const aValue = a[key];
      const bValue = b[key];
      if (aValue === bValue) return 0;
      const comparison = aValue < bValue ? -1 : 1;
      return direction === 'asc' ? comparison : -comparison;
    });
  }, [visible, sort]);

  const totalNet = useMemo(
    () => visible.reduce((sum, txn) => sum + txn.net, 0),
    [visible],
  );

  const handleSort = (key: keyof PaypalTransaction) => {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: DEFAULT_DESC_KEYS.has(key) ? 'desc' : 'asc' },
    );
  };

  const handleExport = () => {
    const rows = sorted.map((txn) =>
      COLUMNS.reduce<Record<string, string>>((row, col) => {
        row[col.key] = formatCell(txn, col);
        return row;
      }, {}),
    );
    const csv = toCsv(
      COLUMNS.map((col) => ({ key: col.key, title: col.label })),
      rows,
    );
    downloadCsv(`paypal-transactions_${range?.start ?? ''}_${range?.end ?? ''}.csv`, csv);
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Transactions
      </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          PayPal transactions report for the selected date range.
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', mb: 2, flexWrap: 'wrap' }}
        >
          <TextField
            label="Start Date"
            type="date"
            value={start}
            onChange={(event) => setStart(event.target.value)}
            error={Boolean(rangeError)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="End Date"
            type="date"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
            error={Boolean(rangeError)}
            helperText={rangeError}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Button type="submit" variant="contained" disabled={isFetching}>
            Run Report
          </Button>
          <Button type="button" variant="outlined" onClick={handleExport} disabled={sorted.length === 0}>
            Export CSV
          </Button>
          {isFetching && <CircularProgress size={20} />}
        </Box>

        <TextField
          label="Filter by Name, Email, or Item"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          sx={{ mb: 2, maxWidth: 400 }}
          fullWidth
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error.message}
          </Alert>
        )}

        {range === null ? (
          <Typography color="text.secondary" sx={{ mt: 4 }}>
            Pick a date range and run the report to see transactions.
          </Typography>
        ) : isPending ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 4 }}>
            <CircularProgress size={24} />
            <Typography>Loading transactions...</Typography>
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {COLUMNS.map((col) => (
                    <TableCell key={col.key} align={col.numeric ? 'right' : 'left'}>
                      <TableSortLabel
                        active={sort.key === col.key}
                        direction={sort.key === col.key ? sort.direction : 'asc'}
                        onClick={() => handleSort(col.key)}
                      >
                        {col.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {sorted.map((txn) => (
                  <TableRow key={txn.txnId}>
                    {COLUMNS.map((col) => (
                      <TableCell key={col.key} align={col.numeric ? 'right' : 'left'}>
                        {formatCell(txn, col)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {sorted.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={COLUMNS.length} align="center">
                      No transactions found for the selected range.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              {sorted.length > 0 && (
                <TableBody component="tfoot">
                  <TableRow>
                    <TableCell colSpan={8} align="right" sx={{ fontWeight: 'bold' }}>
                      Net Amount
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {totalNet.toFixed(2)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              )}
            </Table>
          </TableContainer>
        )}
      </Container>
  );
}
