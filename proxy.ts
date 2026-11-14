import { type NextRequest, NextResponse } from 'next/server';
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

export function proxy(request: NextRequest) {
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
// capitals of their own), the lowercase form of each mixed-case route, and the player
// page's old address.
export const config = {
  matcher: [
    '/((?!_next/|api/|data/|crests/|player/)(?=[^.]*$)(?=.*[A-Z]).*)',
    '/player',
    '/halloffame',
    '/whereispractice',
    '/forms/halloffame',
    '/forms/playeradvocatenomination',
  ],
};
