# Snapshots come from an archive of raw match data, fetched in batches

Every played match's raw match-centre data is kept in `.cache/matches`, one file per season with a match per line, and committed. Player histories, the eligibility record and leaders are calculated from it, so a change to how they're calculated needs no download. Only a change to the fields requested from the CMS (the `matches` format) downloads every season again. The player job downloads the whole current season each night and any match a locked season is missing; leaders make no CMS requests.

The CMS answers many match queries in one request, each under its own alias, and that counts once against its rate limit (500 requests per IP, refilling at about 4 a second, reported on every response). Measured on 2026-11-07: batches of 25 to 150 uncached matches all worked in 2 to 31 seconds; 300 and 600 worked in seconds but had just been fetched, so were likely cached; all 1,059 at once failed with an HTTP 500 after 57 seconds. A full download of five seasons takes about 30 seconds in 11 requests, down from about 18 minutes in about 1,060.

Decisions, so they are not "fixed" later:

- **Batch size 100**: uncached batches of 100 take about 25 seconds, comfortably under the time limit a whole download hits. A rejected batch is asked again one match at a time, so one bad match can't fail its batch.
- **One shared rate limit gate**: every request waits when the reported budget runs low, and a 429 waits for its Retry-After without using up a retry, as found in the usa-club-rugby-eligibility project. More parallel requests don't go faster than the limit.
- **Plain JSON, not compressed**: git already stores the files compressed (a 3.8 MB file packs to 1.0 MB), and with a match per line a night's changes are stored as small deltas. Gzipped files would be stored whole on every change and their diffs unreadable. Netlify already serves `public/data` with Brotli.
- **One file per season, not per round**: rounds are named inconsistently across competitions and playoffs, the current season is one request, and git stores its changes as deltas. Split by month if a season's file or request ever grows too large.
- **Player files stay committed**: they could be calculated at build time from the archive, but builds no longer generate anything, so they stay a snapshot.
