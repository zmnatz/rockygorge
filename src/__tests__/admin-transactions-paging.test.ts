import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchPaypalTransactions } from '../../netlify/functions/admin-transactions';
import type { PaypalRawTransaction } from '@/types/paypal';

type PageResponse = {
  transaction_details?: PaypalRawTransaction[];
  total_pages?: number;
};

function raw(txnId: string, date: string, amount = '10.00'): PaypalRawTransaction {
  return {
    transaction_info: {
      transaction_id: txnId,
      transaction_initiation_date: `${date}T12:00:00Z`,
      transaction_amount: { currency_code: 'USD', value: amount },
    },
  };
}

type PageHandler = (url: URL) => PageResponse;

function mockReportingFetch(handler: PageHandler) {
  const mock = vi.fn(async (url: string) => {
    const data = handler(new URL(url));
    return {
      ok: true,
      status: 200,
      json: () => Promise.resolve(data),
    };
  });
  vi.stubGlobal('fetch', mock);
  return mock;
}

function startDates(mock: ReturnType<typeof vi.fn>): string[] {
  return mock.mock.calls.map(([url]) => new URL(url as string).searchParams.get('start_date') ?? '');
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fetchPaypalTransactions', () => {
  it('pages through a window until every page is fetched', async () => {
    const fetchMock = mockReportingFetch((url) => {
      const page = Number(url.searchParams.get('page'));
      return {
        transaction_details: page === 1 ? [raw('A', '2026-05-01')] : [raw('B', '2026-05-02')],
        total_pages: 2,
      };
    });

    const result = await fetchPaypalTransactions('token', { start: '2026-05-01', end: '2026-05-05' });

    expect(result.map((txn) => txn.txnId)).toEqual(['A', 'B']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('fetches every window of a range longer than 31 days', async () => {
    const fetchMock = mockReportingFetch(() => ({ transaction_details: [], total_pages: 1 }));

    await fetchPaypalTransactions('token', { start: '2026-01-01', end: '2026-03-15' });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(startDates(fetchMock)).toEqual([
      '2026-01-01T00:00:00Z',
      '2026-02-01T00:00:00Z',
      '2026-03-04T00:00:00Z',
    ]);
  });

  it('dedupes a transaction that appears in two windows', async () => {
    mockReportingFetch(() => ({
      transaction_details: [raw('SAME', '2026-02-01')],
      total_pages: 1,
    }));

    const result = await fetchPaypalTransactions('token', { start: '2026-01-01', end: '2026-02-01' });

    expect(result).toHaveLength(1);
    expect(result[0].txnId).toBe('SAME');
  });

  it('drops transactions dated after the requested end date', async () => {
    mockReportingFetch(() => ({
      transaction_details: [raw('IN', '2026-02-01'), raw('OUT', '2026-02-02')],
      total_pages: 1,
    }));

    const result = await fetchPaypalTransactions('token', { start: '2026-01-01', end: '2026-02-01' });

    expect(result.map((txn) => txn.txnId)).toEqual(['IN']);
  });
});
