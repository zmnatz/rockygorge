import { useQuery } from '@tanstack/react-query';
import { get } from '@/utils/api';
import type { PaypalTransaction } from '@/types/paypal';

interface TransactionsResponse {
  transactions: PaypalTransaction[];
}

export function fetchTransactions(
  start: string,
  end: string,
  accessToken?: string | null,
): Promise<PaypalTransaction[]> {
  return get<TransactionsResponse>(
    `/.netlify/functions/admin-transactions?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
    accessToken,
  ).then((data) => data.transactions);
}

export function useTransactions(
  start: string,
  end: string,
  getAccessToken: () => Promise<string | null>,
) {
  return useQuery({
    queryKey: ['admin-transactions', start, end],
    queryFn: async () => {
      const accessToken = await getAccessToken();
      return fetchTransactions(start, end, accessToken);
    },
    enabled: Boolean(start && end),
    staleTime: 0,
  });
}
