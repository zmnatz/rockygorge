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

function toDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function defaultDateRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 30);
  return { start: toDateInput(start), end: toDateInput(end) };
}

interface SortState {
  key: keyof PaypalTransaction;
  direction: 'asc' | 'desc';
}

function getSortValue(txn: PaypalTransaction, key: keyof PaypalTransaction): string | number {
  const value = txn[key];
  if (key === 'gross' || key === 'fee' || key === 'net') return Number(value);
  return value;
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
  const [range, setRange] = useState<{ start: string; end: string } | null>(null);
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState<SortState>({ key: 'date', direction: 'desc' });

  useEffect(() => {
    const defaults = defaultDateRange();
    setStart(defaults.start);
    setEnd(defaults.end);
  }, []);

  const { data = [], isPending, isFetching, error } = useTransactions(
    range?.start ?? '',
    range?.end ?? '',
    getAccessToken,
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!start || !end) return;
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
      const aValue = getSortValue(a, key);
      const bValue = getSortValue(b, key);
      if (aValue === bValue) return 0;
      const comparison = aValue < bValue ? -1 : 1;
      return direction === 'asc' ? comparison : -comparison;
    });
  }, [visible, sort]);

  const totalNet = useMemo(
    () => visible.reduce((sum, txn) => sum + Number(txn.net), 0),
    [visible],
  );

  const handleSort = (key: keyof PaypalTransaction) => {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: key === 'date' || key === 'net' ? 'desc' : 'asc' },
    );
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
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="End Date"
            type="date"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Button type="submit" variant="contained" disabled={isFetching}>
            Run Report
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
                        {txn[col.key]}
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
                      NET Total
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
