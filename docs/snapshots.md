# Build-time snapshots

The site pre-pulls CMS data (scores, standings, scoring leaders, player
histories) into JSON so pages are static. Those pulls were most of the build
time, so the results are **committed to the repo** and refreshed nightly.

| Snapshot  | Output                      | Script                         |
| --------- | --------------------------- | ------------------------------ |
| scores    | `public/data/scores.json`   | `scripts/generate-scores-index.ts` |
| standings | `public/data/standings/`    | `scripts/generate-standings-index.ts` |
| leaders   | `public/data/leaders/`, plus the match-centre cache `.cache/leaders/matches.json` | `scripts/generate-leaders-index.ts` |
| players   | `public/data/players/`      | `scripts/generate-players.ts` |

(Team crests, `public/crests/`, are WebP images, not JSON; they are still
generated every build and cached by Netlify.)

## How freshness works

- `public/data/manifest.json` records an ISO timestamp per snapshot, written
  only after that snapshot was successfully regenerated.
- Each `generate:*` script **skips** its CMS pulls when its timestamp is under
  24 hours old and its output exists. So `bun run build` normally does no CMS
  work for these.
- `.github/workflows/update-snapshots.yml` runs daily at 06:00 UTC (and on
  demand from the Actions tab). It runs `bun run generate:force` and commits
  `public/data` and `.cache/leaders` to `master`. The timestamps change every
  run, so expect one commit per night.

## Forcing an update

```bash
bun run generate:force   # refresh all snapshots now, ignoring the 24h check
bun run build:force      # same, then build
FORCE_SNAPSHOTS=1 bun run build   # equivalent to build:force
bun scripts/generate-players.ts --force   # one snapshot
```

`--force` only applies to the single script it is passed to (`bun run
generate --force` would pass it to the last command only), so for the whole
set use `FORCE_SNAPSHOTS=1` / the `:force` scripts.

After a manual forced refresh you want to keep, commit `public/data` and
`.cache/leaders` (or trigger the workflow instead).

## Notes for agents

- Do not hand-edit `public/data/**` or `.cache/leaders/**`; regenerate them.
- If a snapshot looks stale or wrong locally, run `bun run generate:force`
  rather than deleting files. Generation is best-effort: if the CMS is
  throttled the previous snapshot and its timestamp are kept.
- Do not add `public/data` or `.cache/leaders` to the Netlify cache plugin
  paths; a restored cache would overwrite the committed, fresher copies.
- Only commit regenerated snapshots when the task is about the data; they make
  large diffs.
