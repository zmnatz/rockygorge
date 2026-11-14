import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { caseRedirect, config, legacyPlayerRedirect, MIXED_CASE_ROUTES, proxy } from '../../proxy';
import { mixedCaseRoutes, siteRoutes } from '../utils/siteRoutes';

const request = (path: string) => proxy(new NextRequest(new URL(path, 'https://rockygorge.example')));

describe('the lowercase addresses the static export answered at', () => {
  it('cover every mixed-case page and content item', () => {
    expect([...MIXED_CASE_ROUTES].sort()).toEqual(mixedCaseRoutes(siteRoutes(process.cwd())).sort());
  });

  it('are what the proxy runs on, beside any page path with a capital', () => {
    expect(config.matcher.slice(2).sort()).toEqual(MIXED_CASE_ROUTES.map((route) => route.toLowerCase()).sort());
  });

  it('redirect to the route, keeping the query', () => {
    const response = request('/halloffame?from=qr');
    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe('https://rockygorge.example/hallOfFame?from=qr');
    expect(request('/FORMS/PLAYERADVOCATENOMINATION').headers.get('location')).toBe(
      'https://rockygorge.example/forms/playerAdvocateNomination',
    );
  });

  it('leave the route itself alone', () => {
    expect(request('/hallOfFame').headers.get('location')).toBeNull();
    expect(request('/calendar').headers.get('location')).toBeNull();
  });
});

describe('a path with a capital', () => {
  it('redirects to its lowercase form, as the static host did', () => {
    expect(caseRedirect('/Calendar')).toBe('/calendar');
    expect(caseRedirect('/stats/Jason-Bland')).toBe('/stats/jason-bland');
    expect(caseRedirect('/HALLOFFAME')).toBe('/hallOfFame');
    expect(caseRedirect('/calendar')).toBeNull();
  });

  it('runs the proxy only on page paths, never on files, build assets, data or the API', () => {
    const [pagePaths] = config.matcher;
    const runs = (path: string) => new RegExp(`^${pagePaths}$`).test(path);
    expect(['/Calendar', '/stats/Jason-Bland', '/HALLOFFAME'].every(runs)).toBe(true);
    expect(
      [
        '/calendar',
        '/_next/static/AbC/x.js',
        '/data/players/22gWbAPQNDoqjCXgb.json',
        '/crests/Rocky.webp',
        '/api/Calendar',
        '/Favicon.ico',
        '/player/f5JqeT4vzmH2nxtnR',
      ].some(runs),
    ).toBe(false);
  });
});

describe("the player page's old address", () => {
  it('redirects to the player page, keeping any other query', () => {
    const response = request('/player?id=f5JqeT4vzmH2nxtnR&from=qr');
    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe('https://rockygorge.example/player/f5JqeT4vzmH2nxtnR?from=qr');
  });

  it('is what the proxy runs on', () => {
    expect(config.matcher[1]).toBe('/player');
  });

  it('leaves /player with no id, and the player page itself, alone', () => {
    const url = (path: string) => new URL(path, 'https://rockygorge.example');
    expect(legacyPlayerRedirect(url('/player'))).toBeNull();
    expect(legacyPlayerRedirect(url('/player/f5JqeT4vzmH2nxtnR?id=x'))).toBeNull();
    expect(request('/player/f5JqeT4vzmH2nxtnR').headers.get('location')).toBeNull();
  });
});

describe('siteRoutes', () => {
  it('lists the pages and content routes, without dynamic or special pages', () => {
    const routes = siteRoutes(process.cwd());
    expect(routes).toEqual(expect.arrayContaining(['/', '/calendar', '/stats', '/gauntlet/submit', '/banquet', '/forms/asr']));
    expect(routes.some((route) => route.includes('[') || route.includes('/_'))).toBe(false);
  });
});
