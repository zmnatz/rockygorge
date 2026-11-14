import { type NextRequest, NextResponse } from 'next/server';

// Netlify served the old static export case-insensitively: it redirected any path with a
// capital to lowercase and served the file there, so `/halloffame` is the address people
// saw and shared, and `/Calendar` worked. Next's routes are case-sensitive, so this keeps
// both working (docs/adr/014-nextjs-runtime.md). It can't be a redirect in next.config.ts:
// Next matches a redirect's source without regard to case, so a route would redirect to
// itself.

/** Every route with a capital in it. A test checks this against the pages and content. */
export const MIXED_CASE_ROUTES = ['/hallOfFame', '/whereIsPractice', '/forms/hallOfFame', '/forms/playerAdvocateNomination'];

/** Where a path goes: the mixed-case route it names in any casing, else its lowercase form,
 *  or null when it is already right. */
export function caseRedirect(pathname: string): string | null {
  const lower = pathname.toLowerCase();
  const target = MIXED_CASE_ROUTES.find((route) => route.toLowerCase() === lower) ?? lower;
  return target === pathname ? null : target;
}

export function proxy(request: NextRequest) {
  const target = caseRedirect(request.nextUrl.pathname);
  if (!target) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = target;
  return NextResponse.redirect(url, 308);
}

// Constants, as Next requires, matched with case: a page path with a capital in it (not a
// file, a build asset, the data or the API, whose names have capitals of their own), and
// the lowercase form of each mixed-case route.
export const config = {
  matcher: [
    '/((?!_next/|api/|data/|crests/)(?=[^.]*$)(?=.*[A-Z]).*)',
    '/halloffame',
    '/whereispractice',
    '/forms/halloffame',
    '/forms/playeradvocatenomination',
  ],
};
