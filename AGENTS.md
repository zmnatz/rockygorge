# Agent Guidance: Rocky Gorge

## Developer Commands
- `npm run dev`: Start development server (uses `--webpack`)
- `npm run build`: Production build (uses `--webpack`)
- `npm run lint`: Lint codebase

## Architecture & Tech Stack
- **Framework**: Next.js (Pages Router)
- **Content**: Mixed `.tsx` and `.mdx` in `pages/`.
- **Data**: YAML files located in `src/data/` (powered by `next-plugin-yaml`).
- **UI**: Material UI (MUI) with Emotion.
- **Data Fetching**: TanStack Query.
- **Language**: TypeScript.

## Project Structure
- `pages/`: Route definitions (mix of React components and MDX).
- `src/components/`: Shared UI components.
- `src/data/`: YAML-based data source.
- `src/types/`: TypeScript definitions.
- `src/utils/`: Helper functions.

## Conventions
- Add new content pages as `.mdx` files in `pages/`.
- Store structured content in `src/data/*.yml`.
- Follow MUI patterns for styling and components.

## Agent skills

### Issue tracker

Issues live in GitHub Issues (uses the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role label vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
