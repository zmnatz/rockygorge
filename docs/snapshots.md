# Build-time snapshots

The site pre-pulls CMS data (scores, standings, scoring leaders, player
histories) into JSON so pages are static. Those pulls were most of the build
time, so the results are **committed to the repo** and refreshed nightly.

| Snapshot  | Output                      | Script                         |
| --------- | --------------------------- | ------------------------------ |
| scores    | `public/data/scores.json`, plus `first-paint.json` | `scripts/generate-scores-index.ts` |
| standings | `public/data/standings/`    | `scripts/generate-standings-index.ts` |
| leaders   | `public/data/leaders/`, calculated from the match archive | `scripts/generate-leaders-index.ts` |
| players   | `public/data/players/`, including the eligibility tool's `participation.json`, and the match archive `.cache/matches/` | `scripts/generate-players.ts` |
| crests    | `public/crests/` (WebP team logos) | `scripts/generate-crests.ts` |
| clubPages | `public/data/club-pages.json` (each club's Rugby Xplorer page and crest, confirmed through the CMS) | `scripts/generate-club-pages.ts` |

## How freshness works

`public/data/manifest.json` records when each snapshot's content last **changed**, and the **format** version it was generated with. Generating writes only files whose content differs (ignoring `generatedAt`), so a run that finds nothing new changes nothing. `.cache/snapshots-checked.json` is a local record of when a run last checked the CMS, and isn't committed.

**Builds don't touch the CMS.** `bun run build`, which is all Netlify runs, is just `next build` from the committed snapshots. Only the nightly workflow or a deliberate run refreshes them, so a PR that changes a snapshot's format must regenerate and commit it, or the format test fails.

Run by hand, `bun run generate` skips a snapshot whose format is current. `bun run generate:force` refreshes everything.

`.github/workflows/update-snapshots.yml` runs daily at 06:00 UTC (and on demand). It runs `bun run generate:force` and commits `public/data`, `public/crests` and `.cache` to `master` if anything changed. That push is what triggers the Netlify build, so a quiet night makes no commit and no build. `public/data/first-paint.json` records what the home and Gameday pages' static HTML would show, so a night that changes it, such as a match day arriving, still gets a build. Nothing reads that file. To see whether a night ran, check the workflow's runs in GitHub Actions. A job that fails keeps its previous data, the others still run and are committed, and the run then fails, so GitHub sends its usual failed-run notification. Scheduled runs notify whoever last changed the workflow's schedule.

## Changing a snapshot's format

If a PR changes what a generator writes (shape of the JSON, filtering logic):

1. Bump that snapshot's number in `SNAPSHOT_FORMATS`.
2. Run `bun run generate:force` and commit the regenerated `public/data`,
   `public/crests` and `.cache`.

A test (`snapshot-freshness.test.ts`) fails until the committed manifest
matches the code's format versions, so CI catches a forgotten regeneration.

## The match archive

The decisions behind it are in `docs/adr/013-match-archive-and-batched-requests.md`.

`.cache/matches/` holds the raw match-centre data for every played match, one file per season, a match per line. The player job downloads every current-season match each night, plus any locked-season match it doesn't have, and then calculates player histories, `participation.json` and (in the leaders job) the leaderboards from the whole archive. So a change to how those are calculated needs no download: bump that snapshot's format and regenerate, which takes seconds.

Bump `matches` only when the fields requested from the CMS change. That downloads every season again, in about a dozen batched requests.

## Results before the current season are locked

Each snapshot reads only the current season, every night, and keeps older seasons from the committed files. A finished season gets one last read as the next one begins, because the season saved as current is re-read first. Everything is read when the saved files are missing or that snapshot's format changed. Nothing reads a locked season otherwise. `--full-history` is a manual override for an exceptional correction:

```bash
bun scripts/generate-standings-index.ts --force --full-history
bun scripts/generate-players.ts --force --full-history   # downloads every match again
bun scripts/generate-club-pages.ts --force --full-history
```

Fixture lists are in `public/data/standings/`. The other snapshots read them rather than asking the CMS again, so standings must run first. Only the standings job reads every playing club's feed, because the union's feed misses some of its own fixtures. It stops reading a feed at the first page with nothing from the current season. It reads three club feeds at a time.

The club pages job asks the CMS about a playing club only when it's new, every 30 days once its page is confirmed, or every 7 days until then. The player job doesn't fetch forfeits, which aren't counted. Forfeits already saved in locked seasons stay as they are until a format change. Each job logs its CMS requests, retries and waiting time. The CMS allows each IP a budget of 500 requests, refilling at about 4 a second, and reports what's left on every response. All requests share one gate that pauses when the budget runs low and waits out a 429's `Retry-After` without using up a retry, so a long pull slows down rather than failing. The player job asks for 100 matches per request, which counts once against that budget, so a full download of every season is about a dozen requests. A batch the CMS rejects is asked again one match at a time.

## Forcing an update

```bash
bun run generate:force   # refresh all snapshots now
bun run build:force      # same, then build
bun scripts/generate-players.ts --force   # one snapshot
```

`--force` only applies to the single script it is passed to (`bun run
generate --force` would pass it to the last command only), so for the whole
set use the `:force` scripts.

After a manual forced refresh you want to keep, commit `public/data`,
`public/crests` and `.cache` (or trigger the workflow instead).

## Notes for agents

- Do not hand-edit `public/data/**`, `public/crests/**` or `.cache/**`; regenerate them.
- If a snapshot looks stale or wrong locally, run `bun run generate:force`
  rather than deleting files. Generation is best-effort: if the CMS is
  throttled the previous snapshot and its timestamp are kept.
- Do not add `public/data`, `public/crests` or `.cache/matches` to the Netlify cache plugin
  paths; a restored cache would overwrite the committed, fresher copies.
- Only commit regenerated snapshots when the task is about the data; they make
  large diffs.
- CMS pulls are not perfectly repeatable (a past season's fixture count and
  crest URLs can differ between pulls), so a forced refresh can produce a diff
  that is upstream noise rather than a real change. Skim the diff before
  committing it.
