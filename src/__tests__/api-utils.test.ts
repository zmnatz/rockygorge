import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get, post } from '@/utils/api';

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

describe('get', () => {
  it('calls fetch with GET method and JSON headers', async () => {
    const fetchMock = mockFetch(200, { data: 'ok' });
    vi.stubGlobal('fetch', fetchMock);

    await get('/api/test');

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith('/api/test', {
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('returns parsed JSON on success', async () => {
    vi.stubGlobal('fetch', mockFetch(200, { items: [1, 2, 3] }));

    const result = await get<{ items: number[] }>('/api/test');

    expect(result).toEqual({ items: [1, 2, 3] });
  });

  it('returns undefined for empty 200 responses', async () => {
    vi.stubGlobal('fetch', mockFetch(200));

    const result = await get<undefined>('/api/test');

    expect(result).toBeUndefined();
  });
});

describe('post', () => {
  it('calls fetch with POST method, JSON body and headers', async () => {
    const fetchMock = mockFetch(200, { ok: true });
    vi.stubGlobal('fetch', fetchMock);

    await post('/api/test', { name: 'test' });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith('/api/test', {
      method: 'POST',
      body: JSON.stringify({ name: 'test' }),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('returns parsed JSON on success', async () => {
    vi.stubGlobal('fetch', mockFetch(200, { id: 1 }));

    const result = await post<{ id: number }>('/api/test', {});

    expect(result).toEqual({ id: 1 });
  });

  it('returns undefined for empty 200 responses', async () => {
    vi.stubGlobal('fetch', mockFetch(200));

    const result = await post<undefined>('/api/test', {});

    expect(result).toBeUndefined();
  });
});

describe('error handling', () => {
  it('throws with API error message on non-OK response', async () => {
    vi.stubGlobal('fetch', mockFetch(400, { error: 'Invalid input' }));

    await expect(get('/api/test')).rejects.toThrow('Invalid input');
  });

  it('throws with status code when error body has no message', async () => {
    vi.stubGlobal('fetch', mockFetch(500, {}));

    await expect(get('/api/test')).rejects.toThrow('Request failed: 500');
  });

  it('throws with status code when error body is not JSON', async () => {
    const response = {
      ok: false,
      status: 502,
      json: () => Promise.reject(new Error('bad json')),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));

    await expect(get('/api/test')).rejects.toThrow('Request failed: 502');
  });
});
