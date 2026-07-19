# Agent Guidance: Rocky Gorge

## Developer Commands
- `npm run dev`: Start development server (uses `--webpack`)
- `npm run build`: Production build (uses `--webpack`)
- `npm run lint`: Lint codebase

## Architecture & Tech Stack
- **Framework**: Next.js (Pages Router)
- **Content**: Mixed `.tsx` and `.mdx` in `pages/`.
- **Data**: YAML files in `content/` (user-facing site data) and `config/` (application configuration), powered by `next-plugin-yaml`.
- **UI**: Material UI (MUI) with Emotion.
- **Data Fetching**: TanStack Query.
- **Language**: TypeScript.

## Project Structure
- `pages/`: Route definitions (mix of React components and MDX).
- `src/components/`: Shared UI components.
- `content/`: YAML site data (events, calendar, store, forms, links, gauntlet, stats).
- `config/`: YAML application configuration (admin, link_mappings).
- `src/types/`: TypeScript definitions.
- `src/utils/`: Helper functions.

## Conventions
- Add new content pages as `.mdx` files in `pages/`.
- Store site content in `content/*.yml` (import via `@content/`).
- Store app configuration in `config/*.yml` (import via `@config/`).
- Follow MUI patterns for styling and components.

## Agent skills

### Issue tracker

Issues live in GitHub Issues (uses the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role label vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
