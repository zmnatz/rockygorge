import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchAdminData } from '@/api/admin';

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

describe('fetchAdminData', () => {
  it('fetches the admin endpoint for the given page', async () => {
    const fetchMock = mockFetch(200, { items: [] });
    vi.stubGlobal('fetch', fetchMock);

    await fetchAdminData('events');

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith('/.netlify/functions/events', {
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('returns the parsed JSON body on success', async () => {
    vi.stubGlobal('fetch', mockFetch(200, { filters: [] }));

    const result = await fetchAdminData('calendar');

    expect(result).toEqual({ filters: [] });
  });

  it('throws with the API error message on a failed response', async () => {
    vi.stubGlobal('fetch', mockFetch(401, { error: 'Authentication required' }));

    await expect(fetchAdminData('events')).rejects.toThrow('Authentication required');
  });
});
