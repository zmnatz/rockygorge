import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchTransactions } from '@/api/transactions';

function mockFetch(status: number, body?: unknown) {
  const response = {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(body !== undefined ? JSON.stringify(body) : ''),
    json: () => Promise.resolve(body),
  };
  return vi.fn().mockResolvedValue(response);
}

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch(200));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fetchTransactions', () => {
  it('queries the admin-transactions function with the given range', async () => {
    const fetchMock = mockFetch(200, { transactions: [] });
    vi.stubGlobal('fetch', fetchMock);

    await fetchTransactions('2026-05-01', '2026-05-31');

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      '/.netlify/functions/admin-transactions?start=2026-05-01&end=2026-05-31',
      { headers: { 'Content-Type': 'application/json' } },
    );
  });

  it('sends the Netlify Identity JWT as a bearer token when provided', async () => {
    const fetchMock = mockFetch(200, { transactions: [] });
    vi.stubGlobal('fetch', fetchMock);

    await fetchTransactions('2026-05-01', '2026-05-31', 'identity-jwt');

    expect(fetchMock).toHaveBeenCalledWith(
      '/.netlify/functions/admin-transactions?start=2026-05-01&end=2026-05-31',
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer identity-jwt',
        },
      },
    );
  });

  it('returns the parsed transactions on success', async () => {
    const transactions = [{ txnId: 'TXN-1', net: '23.75' }];
    vi.stubGlobal('fetch', mockFetch(200, { transactions }));

    const result = await fetchTransactions('2026-05-01', '2026-05-31');

    expect(result).toEqual(transactions);
  });

  it('throws with the function error message on a failed response', async () => {
    vi.stubGlobal('fetch', mockFetch(403, { error: 'PayPal Transaction Search is not enabled' }));

    await expect(fetchTransactions('2026-05-01', '2026-05-31')).rejects.toThrow(
      'PayPal Transaction Search is not enabled',
    );
  });
});
