# Player pages are rendered on request, at /player/<cms-id>

**The first page rendered on request, which [ADR 014](014-nextjs-runtime.md) moved to Netlify's Next.js runtime for.**

A player page was `/player?id=<cms-id>`: an empty page that fetched the player's snapshot, `public/data/players/<cms-id>.json`, after load, because a static export can't build a page for each of the 5,500 or so players without building them all. With the runtime, each player has a page of their own, with their games and scores in its HTML.

Decisions, so they are not "fixed" later:

- **The build renders no player page.** `getStaticPaths` in `pages/player/[id].tsx` returns no paths with `fallback: 'blocking'`. The first request for `/player/<cms-id>` runs `getStaticProps`, which reads the player's snapshot from disk (`readPlayerHistory`), and the page is cached until the next deploy. No `revalidate`: the snapshots only change with the nightly commit, and that commit is a deploy. The eligibility site does the same (its ADR 015).
- **The snapshots are calculated at build time and read from the CDN.** They are no longer committed. `bun run build` runs `scripts/generate-players.ts --offline` first, which calculates `public/data/players/` from the committed match archive in a few seconds, with no CMS requests (the nightly job still downloads new matches into the archive). The directory is gitignored. The route's function doesn't carry it: `outputFileTracingExcludes` in `next.config.ts` drops `public/data` from every function, and `readPlayerHistory` fetches `players/<cms-id>.json` from the function's own deploy, at `PUBLISHED_DATA_URL` (the deploy's permalink, from `DEPLOY_URL`), as the eligibility site does (its ADR 019). The build, `next start` and `next dev` read the disk. The build makes no request at all.
- **An id with no snapshot is a 404**, and so is anything that isn't a CMS id, which is never read as a path.
- **The old address redirects.** `proxy.ts` sends `/player?id=<cms-id>` to `/player/<cms-id>` with a 308, keeping any other query. Links from the match centre and the leaders table go straight to the new path (`playerPath`).
- **A player path keeps its capitals.** CMS ids are mixed case, so `proxy.ts` leaves `/player/` out of the lowercase redirect ADR 014 added for the static host's old addresses.
- **Dates are in the club's time zone** (`America/New_York`), since the page is rendered on a server whose time zone isn't the visitor's.
- **A commit that can't change the site isn't built.** `ignore` in `netlify.toml` skips a build when nothing has changed since the last one but the docs, the tests, CI and editor config, agent skills, or Markdown. A build without cache, where Netlify gives the same commit for both, always builds, and so does any error from `git`. The nightly snapshot commit changes `.cache`, so it still builds.
- **The eligibility link is always shown.** The player page links to `eligibilityPlayerUrl(id)` for every player, and the eligibility site answers 404 for an id it has no page for. The build doesn't ask that site which ids it has (the old `eligibility` flag in each file is gone), so the two sites stay independent.
