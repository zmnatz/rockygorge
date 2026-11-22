import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CALENDAR_CACHE_CONTROL,
  CALENDAR_ERROR_CACHE_CONTROL,
  CALENDAR_SHORT_MAX_AGE_SECONDS,
  fetchCalendarItems,
  setCalendarCacheHeader,
} from '@/utils/calendarServer';

afterEach(() => vi.unstubAllGlobals());

describe('fetchCalendarItems', () => {
  it('returns null without an API key, and makes no request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchCalendarItems(new Date(), '')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maps the items and drops their descriptions', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          items: [
            {
              summary: 'Practice',
              description: 'long text',
              location: 'Field 1',
              htmlLink: 'https://example.test',
              start: { dateTime: '2026-11-24T22:00:00Z' },
              end: { dateTime: '2026-11-25T00:00:00Z' },
            },
          ],
        }),
      }))
    );
    const items = await fetchCalendarItems(new Date('2026-11-22T12:00:00Z'), 'key');
    expect(items).toEqual([
      {
        summary: 'Practice',
        location: 'Field 1',
        htmlLink: 'https://example.test',
        start: '2026-11-24T22:00:00Z',
        end: '2026-11-25T00:00:00Z',
      },
    ]);
  });

  it('keeps the descriptions when asked to', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          items: [
            {
              summary: 'Open',
              description: 'Golf outing',
              location: '',
              htmlLink: '',
              start: { date: '2026-12-01' },
              end: { date: '2026-12-02' },
            },
          ],
        }),
      }))
    );
    const [item] = (await fetchCalendarItems(new Date(), 'key', true)) ?? [];
    expect(item?.description).toBe('Golf outing');
  });

  it('returns null when Google answers with an error or the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })));
    expect(await fetchCalendarItems(new Date(), 'key')).toBeNull();
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new Error('offline'))));
    expect(await fetchCalendarItems(new Date(), 'key')).toBeNull();
  });
});

describe('setCalendarCacheHeader', () => {
  it('caches for 15 minutes with no stale-while-revalidate, and a failed read only briefly', () => {
    const setHeader = vi.fn();
    setCalendarCacheHeader({ setHeader }, []);
    expect(setHeader).toHaveBeenLastCalledWith('Cache-Control', CALENDAR_CACHE_CONTROL);
    expect(CALENDAR_CACHE_CONTROL).toBe('public, s-maxage=900');
    expect(CALENDAR_CACHE_CONTROL).not.toContain('stale');
    setCalendarCacheHeader({ setHeader }, [], CALENDAR_SHORT_MAX_AGE_SECONDS);
    expect(setHeader).toHaveBeenLastCalledWith('Cache-Control', 'public, s-maxage=300');
    setCalendarCacheHeader({ setHeader }, null);
    expect(setHeader).toHaveBeenLastCalledWith('Cache-Control', CALENDAR_ERROR_CACHE_CONTROL);
  });
});
