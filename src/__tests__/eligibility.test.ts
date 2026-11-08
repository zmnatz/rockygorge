import { afterEach, describe, expect, it, vi } from 'vitest';
import { eligibilityRoutes, loadParticipationSnapshot } from '@/utils/eligibility';

const respond = (body: string, status: number, contentType: string) =>
  vi.stubGlobal('fetch', vi.fn(async () => new Response(body, { status, headers: { 'content-type': contentType } })));

describe('loadParticipationSnapshot', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the saved snapshot', async () => {
    respond('{"season":"2026/2027","rows":[],"gaps":[]}', 200, 'application/json');
    await expect(loadParticipationSnapshot()).resolves.toEqual({ season: '2026/2027', rows: [], gaps: [] });
  });

  it('treats a 404 as missing', async () => {
    respond('', 404, 'text/plain');
    await expect(loadParticipationSnapshot()).resolves.toBeNull();
  });

  it("treats the host's HTML fallback as missing", async () => {
    respond('<!doctype html>', 200, 'text/html');
    await expect(loadParticipationSnapshot()).resolves.toBeNull();
  });

  it('throws on any other failure', async () => {
    respond('', 500, 'text/plain');
    await expect(loadParticipationSnapshot()).rejects.toThrow('500');
  });
});

describe('eligibilityRoutes', () => {
  it('links a club to the report, encoding its key', () => {
    expect(eligibilityRoutes.club('a&b')).toBe('/utils/eligibility?club=a%26b');
  });

  it('links a player to their page, encoding their id', () => {
    expect(eligibilityRoutes.player('a/b')).toBe('/player?id=a%2Fb');
  });

  it('links to the methodology page', () => {
    expect(eligibilityRoutes.methodology()).toBe('/utils/eligibility-methodology');
  });
});
