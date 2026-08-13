import { useQuery } from '@tanstack/react-query';
import { get } from '@/utils/api';
import type { PaypalTransaction } from '@/types/paypal';

interface TransactionsResponse {
  transactions: PaypalTransaction[];
}

export function fetchTransactions(start: string, end: string): Promise<PaypalTransaction[]> {
  return get<TransactionsResponse>(
    `/.netlify/functions/admin-transactions?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
  ).then((data) => data.transactions);
}

export function useTransactions(start: string, end: string) {
  return useQuery({
    queryKey: ['admin-transactions', start, end],
    queryFn: () => fetchTransactions(start, end),
    enabled: Boolean(start && end),
    staleTime: 0,
  });
}
