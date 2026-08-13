import { useQuery } from '@tanstack/react-query';
import { get } from '@/utils/api';
import type { DateRange } from '@/types/date-range';
import type { PaypalTransaction } from '@/types/paypal';

interface TransactionsResponse {
  transactions: PaypalTransaction[];
}

export function fetchTransactions(
  range: DateRange,
  accessToken?: string | null,
): Promise<PaypalTransaction[]> {
  return get<TransactionsResponse>(
    `/.netlify/functions/admin-transactions?start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}`,
    accessToken,
  ).then((data) => data.transactions);
}

export function useTransactions(
  range: DateRange,
  getAccessToken: () => Promise<string | null>,
) {
  return useQuery({
    queryKey: ['admin-transactions', range.start, range.end],
    queryFn: async () => {
      const accessToken = await getAccessToken();
      return fetchTransactions(range, accessToken);
    },
    enabled: Boolean(range.start && range.end),
    staleTime: 0,
  });
}
