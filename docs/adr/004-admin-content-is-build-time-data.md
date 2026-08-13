# ADR: Admin content is build-time data

## Status

Accepted

## Context

The Admin Console edits Content and Config, which live as YAML files in the repo (`content/`, `config/`) and reach pages as `initialData` via `getStaticProps` (SSG) at build time. The Netlify functions that persist admin edits (`netlify/functions/admin-*.ts`, all built on `createAdminHandler`) are strictly POST — they return 405 for any other method. Saving runs through a PR flow: the handler writes the updated YAML to a new branch and opens a pull request; the change becomes live only when that PR is merged and the site is rebuilt.

When `AdminPage`'s read path was migrated from `get()` + `useEffect` to TanStack Query (`useAdminData` in `src/api/admin.ts`), the natural question was whether the query should refetch on remount. A code review flagged `staleTime: Infinity` plus seed-once as "implemented but wrong," assuming a live read path. There is none: a GET to any admin function returns 405, and admin content has no runtime representation — it only changes via a rebuild. Remounting after a save and seeing the last committed state is correct behavior, because the edit is sitting in an unmerged PR.

## Decision

Admin pages treat the query as a hydration vehicle for build-time props, never as a live read:

- `useAdminData` sets `staleTime: Infinity` — the data is fixed at build time and must not be refetched.
- The working copy (`items`/`globals`) is seeded once per endpoint from the query's `initialData` (the YAML-derived SSG props) using adjust-state-during-render; later data changes are ignored so refetches or invalidations can never clobber unsaved edits.
- Saving remains a POST to the admin handler → branch → PR → merge → redeploy → rebuild. A save is not visible until that chain completes.

## Consequences

- A full page load after a rebuild always shows current content via fresh SSG props.
- `fetchAdminData` is vestigial today (a GET would return 405). Future read work — for example the PayPal transactions admin — must add a GET-capable path if it wants live data; `fetchAdminData` is the seam for it.
- Any future refetch or invalidation of the admin query is ignored by the working copy by design. Do not add `refetchInterval` or `invalidateQueries` for admin content without first making the read path real.

## Notes

- The PayPal transactions admin (#136–#142) deliberately did not reuse `fetchAdminData`. It adds a dedicated GET proxy (`/.netlify/functions/admin-transactions` + `useTransactions` in `src/api/transactions.ts`): the endpoint is bearer-authenticated and parameterized by a date range, which does not fit the seed-once, build-time shape of `fetchAdminData`. The live-vs-build-time distinction is preserved — `useTransactions` uses `staleTime: 0` (a live read) whereas `useAdminData` keeps `staleTime: Infinity`. `fetchAdminData` remains the seam for future unauthenticated build-time admin reads.
