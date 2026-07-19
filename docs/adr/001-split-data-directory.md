# ADR: Split src/data/ into content/ and config/

## Status

Accepted

## Context

The `src/data/` directory mixed two distinct concerns — site content (events, calendar, store, stats) and application configuration (admin permissions, link mappings) — in a single folder nested inside `src/`. This created:

1. **Conceptual ambiguity**: Content files (things users see) sat alongside config files (things that drive app behavior) with no distinction.
2. **Poor discoverability**: Data files were buried inside `src/`, requiring navigation past components, utils, and types.
3. **Inconsistent import patterns**: Most files used `@/data/...` but admin pages used relative paths (`../../src/data/admin.yml`).

## Decision

Split `src/data/` into two root-level directories:

- **`content/`** — Site data that users see: `calendar.yml`, `events.yml`, `store.yml`, `forms.yml`, `links.yml`, `gauntlet/`, `stats/`
- **`config/`** — Application configuration: `admin.yml`, `link_mappings.yml`

Added two new path aliases (`@content/*` and `@config/*`) while keeping `@/*` unchanged. Updated all imports, Netlify function string paths, and type declarations.

## Consequences

- Data files are now at the repo root, improving discoverability.
- Content vs. config is visually and structurally distinct.
- All imports use the alias convention (`@content/`, `@config/`) consistently — no more mixed relative paths.
- The `@/*` alias remains unchanged, so component/util/type imports don't need updating.
- Netlify functions use clean paths (`content/calendar.yml`) instead of nested paths (`src/data/calendar.yml`).
