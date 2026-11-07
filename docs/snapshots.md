# Build-time snapshots

The site pre-pulls CMS data (scores, standings, scoring leaders, player
histories) into JSON so pages are static. Those pulls were most of the build
time, so the results are **committed to the repo** and refreshed nightly.

| Snapshot  | Output                      | Script                         |
| --------- | --------------------------- | ------------------------------ |
| scores    | `public/data/scores.json`   | `scripts/generate-scores-index.ts` |
| standings | `public/data/standings/`    | `scripts/generate-standings-index.ts` |
| leaders   | `public/data/leaders/`, plus the match-centre cache `.cache/leaders/matches.json` | `scripts/generate-leaders-index.ts` |
| players   | `public/data/players/`, including the eligibility tool's `participation.json` (reads the standings snapshot for every side's fixtures) | `scripts/generate-players.ts` |
| crests    | `public/crests/` (WebP team logos) | `scripts/generate-crests.ts` |

## How freshness works

Two small files track the snapshots:

- `public/data/manifest.json`: when each snapshot's content last **changed**,
  and the **format** version it was generated with.
- `.cache/snapshots-checked.json`: when each snapshot was last **checked**
  against the CMS, changed or not. Freshness is judged from this one.

Generating writes only files whose content differs (ignoring `generatedAt`),
so a run that finds nothing new changes just the checked file.

Each `generate:*` script decides whether to skip its CMS pulls:

- **Netlify / CI** (`NETLIFY` or `CI` set): skip when checked under 24 hours
  ago and the output exists. Normal builds do no CMS work for these.
- **Local builds**: always use the committed snapshot, whatever its age, so
  `bun run build` never dirties your working tree. Refresh deliberately with
  `bun run generate:force`.
- **Format change**: if a snapshot's committed `format` differs from
  `SNAPSHOT_FORMATS` in `scripts/lib/snapshot-freshness.ts`, it is stale
  everywhere, local included, and regenerates.

`.github/workflows/update-snapshots.yml` runs daily at 06:00 UTC (and on
demand). It runs `bun run generate:force` and commits `public/data`,
`public/crests` and `.cache` to `master`. The checked file changes every run,
so there is a small commit nightly, and that push is what triggers the nightly
Netlify build. A failed update means no nightly build.

## Changing a snapshot's format

If a PR changes what a generator writes (shape of the JSON, filtering logic):

1. Bump that snapshot's number in `SNAPSHOT_FORMATS`.
2. Run `bun run generate:force` and commit the regenerated `public/data`,
   `public/crests` and `.cache`.

A test (`snapshot-freshness.test.ts`) fails until the committed manifest
matches the code's format versions, so CI catches a forgotten regeneration.

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

After a manual forced refresh you want to keep, commit `public/data`,
`public/crests` and `.cache` (or trigger the workflow instead).

## Notes for agents

- Do not hand-edit `public/data/**`, `public/crests/**` or `.cache/**`; regenerate them.
- If a snapshot looks stale or wrong locally, run `bun run generate:force`
  rather than deleting files. Generation is best-effort: if the CMS is
  throttled the previous snapshot and its timestamp are kept.
- Do not add `public/data`, `public/crests` or `.cache/leaders` to the Netlify cache plugin
  paths; a restored cache would overwrite the committed, fresher copies.
- Only commit regenerated snapshots when the task is about the data; they make
  large diffs.
- CMS pulls are not perfectly repeatable (a past season's fixture count and
  crest URLs can differ between pulls), so a forced refresh can produce a diff
  that is upstream noise rather than a real change. Skim the diff before
  committing it.
