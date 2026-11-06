# Agent Guidance: Rocky Gorge

## Developer Commands
- `bun install`: Install dependencies
- `bun run dev`: Start development server (Turbopack)
- `bun run build`: Production build (Turbopack)
- `bun run lint`: Lint codebase (Biome)
- `bun run test`: Run tests (Vitest)
- `bun run generate:force`: Refresh the committed build-time snapshots (`public/data/`, `public/crests/`, `.cache/leaders`) ignoring the 24h freshness check. `bun run build:force` also builds. Normal `build` skips snapshots under a day old; see `docs/snapshots.md`.

## Architecture & Tech Stack
- **Framework**: Next.js (Pages Router)
- **Content**: Mixed `.tsx` and `.mdx` in `pages/`.
- **Data**: YAML files in `content/` (user-facing site data) and `config/` (application configuration), powered by `yaml-loader` via Turbopack `turbopack.rules`.
- **UI**: Material UI (MUI) with Emotion.
- **Data Fetching**: TanStack Query.
- **Language**: TypeScript.

## Project Structure
- `pages/`: Route definitions (mix of React components and MDX).
- `src/components/`: Shared UI components.
- `content/`: YAML site data (events, calendar, store, forms, links, gauntlet, stats).
- `config/`: YAML application configuration (admin, link_mappings).
- `public/data/`, `public/crests/`, `.cache/leaders/`: generated CMS snapshots, committed and updated nightly by `.github/workflows/update-snapshots.yml`. Never hand-edit; regenerate (`docs/snapshots.md`).
- `src/types/`: TypeScript definitions.
- `src/utils/`: Helper functions.

## Conventions
- Add new content pages as `.mdx` files in `pages/`.
- Store site content in `content/*.yml` (import via `@content/`).
- Store app configuration in `config/*.yml` (import via `@config/`).
- Follow MUI patterns for styling and components.

## Pull Requests
- For PRs that change UI, add a `## Screenshots` section to the description listing the pages to capture, one path per line (e.g. `/gameday`). The deploy-preview run screenshots them at desktop and mobile widths and posts the images in a PR comment. The `.github/pull_request_template.md` has the format.
- Add `wait: <selector>` or `delay: <ms>` after a path for pages that fill in after load (e.g. `/gameday wait: [data-testid=match-centre]`).
- The section is encouraged, not required. Without it the run captures only `/` (plus routes mapped from changed files in `config/screenshots.yml`) and says so in its comment. Do your best to list the pages your change touches.
- Commit messages are unchanged.

## Agent skills

### Issue tracker

Issues live in GitHub Issues (uses the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role label vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
