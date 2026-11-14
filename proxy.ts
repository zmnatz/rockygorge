import { type NextRequest, NextResponse } from 'next/server';
import { ELIGIBILITY_SITE } from '@/utils/eligibilitySite';
import { playerPath } from '@/utils/playerHistory';

// Netlify served the old static export case-insensitively: it redirected any path with a
// capital to lowercase and served the file there, so `/halloffame` is the address people
// saw and shared, and `/Calendar` worked. Next's routes are case-sensitive, so this keeps
// both working (docs/adr/014-nextjs-runtime.md). It can't be a redirect in next.config.ts:
// Next matches a redirect's source without regard to case, so a route would redirect to
// itself.

/** Every route with a capital in it. A test checks this against the pages and content. */
export const MIXED_CASE_ROUTES = ['/hallOfFame', '/whereIsPractice', '/forms/hallOfFame', '/forms/playerAdvocateNomination'];

/** Where a path goes: the mixed-case route it names in any casing, else its lowercase form,
 *  or null when it is already right or is a player page. */
export function caseRedirect(pathname: string): string | null {
  // A player page's path is a CMS id, capitals and all (ADR 016).
  if (pathname.startsWith('/player/')) return null;
  const lower = pathname.toLowerCase();
  const target = MIXED_CASE_ROUTES.find((route) => route.toLowerCase() === lower) ?? lower;
  return target === pathname ? null : target;
}

/** The player page's old address, `/player?id=<cms-id>`, from before player pages had a
 *  path of their own (ADR 016). It was linked from results and shared. */
export function legacyPlayerRedirect(url: URL): URL | null {
  const id = url.searchParams.get('id');
  if (url.pathname !== '/player' || !id) return null;
  const target = new URL(url);
  target.pathname = playerPath(id);
  target.searchParams.delete('id');
  return target;
}

// Club keys, the data package's `clubKey`, are lowercase words joined by hyphens.
const CLUB_KEY = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Where the eligibility report's old pages went: the USA Club Rugby eligibility site
 *  (ADR 015). `/utils/eligibility?club=<key>` goes to that club's page there, since both
 *  sites key clubs by `clubKey`, and without a club to Rocky Gorge's. Not a Netlify
 *  redirect, which would pass the old query on. */
export function eligibilityRedirect(url: URL): string | null {
  if (url.pathname === '/utils/eligibility-methodology') return `${ELIGIBILITY_SITE}/methodology/`;
  if (url.pathname !== '/utils/eligibility') return null;
  const club = url.searchParams.get('club');
  return `${ELIGIBILITY_SITE}/club/${club && CLUB_KEY.test(club) ? club : 'rocky-gorge'}/`;
}

export function proxy(request: NextRequest) {
  const eligibility = eligibilityRedirect(request.nextUrl);
  if (eligibility) return NextResponse.redirect(eligibility, 301);
  const legacy = legacyPlayerRedirect(request.nextUrl);
  if (legacy) return NextResponse.redirect(legacy, 308);
  const target = caseRedirect(request.nextUrl.pathname);
  if (!target) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = target;
  return NextResponse.redirect(url, 308);
}

// Constants, as Next requires, matched with case: a page path with a capital in it (not a
// file, a build asset, the data, the API or a player page, whose names and ids have
// capitals of their own), the player page's and the eligibility report's old addresses,
// and the lowercase form of each mixed-case route.
export const config = {
  matcher: [
    '/((?!_next/|api/|data/|crests/|player/)(?=[^.]*$)(?=.*[A-Z]).*)',
    '/player',
    '/utils/eligibility',
    '/utils/eligibility-methodology',
    '/halloffame',
    '/whereispractice',
    '/forms/halloffame',
    '/forms/playeradvocatenomination',
  ],
};
