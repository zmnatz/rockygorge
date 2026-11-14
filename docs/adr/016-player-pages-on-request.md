# Player pages are rendered on request, at /player/<cms-id>

**The first page rendered on request, which [ADR 014](014-nextjs-runtime.md) moved to Netlify's Next.js runtime for.**

A player page was `/player?id=<cms-id>`: an empty page that fetched the player's snapshot, `public/data/players/<cms-id>.json`, after load, because a static export can't build a page for each of the 5,500 or so players without building them all. With the runtime, each player has a page of their own, with their games and scores in its HTML.

Decisions, so they are not "fixed" later:

- **The build renders no player page.** `getStaticPaths` in `pages/player/[id].tsx` returns no paths with `fallback: 'blocking'`. The first request for `/player/<cms-id>` runs `getStaticProps`, which reads the player's snapshot from disk (`readPlayerHistory`), and the page is cached until the next deploy. No `revalidate`: the snapshots only change with the nightly commit, and that commit is a deploy. The eligibility site does the same (its ADR 015).
- **The snapshots stay where they are.** The nightly job still writes `public/data/players/`, so nothing about generating them changes. The route's function carries them, through `outputFileTracingIncludes` in `next.config.ts` (about 30 MB). The read is marked `turbopackIgnore`, since tracing a path built at run time would carry the whole project.
- **An id with no snapshot is a 404**, and so is anything that isn't a CMS id, which is never read as a path.
- **The old address redirects.** `proxy.ts` sends `/player?id=<cms-id>` to `/player/<cms-id>` with a 308, keeping any other query. Links from the match centre and the leaders table go straight to the new path (`playerPath`).
- **A player path keeps its capitals.** CMS ids are mixed case, so `proxy.ts` leaves `/player/` out of the lowercase redirect ADR 014 added for the static host's old addresses.
- **Dates are in the club's time zone** (`America/New_York`), since the page is rendered on a server whose time zone isn't the visitor's.
