# Rocky Gorge Rugby

The official website for [Rocky Gorge Rugby Football Club](https://rockygorgerugby.com) — a premier men's rugby club based in Columbia, Maryland. The club competes in Division I and Division III men's rugby and is a 2012 & 2014 Division II National Champion and 2025 Division III Atlantic Super Regional Champion.

## Features

- **Online Store** — Purchase banquet tickets, golf outing packages, donations, player dues, gear, and sponsorships via PayPal
- **Statistics Dashboard** — Per-game and season-aggregated player and team stats with sortable, filterable views
- **Gauntlet Challenge** — Fitness leaderboard for the rowing/erg challenge with player submissions
- **Calendar** — Live Google Calendar integration showing training, matches, and events
- **Admin Panel** — Data-driven CRUD interface for managing store items, events, links, and forms via GitHub PRs
- **Content Pages** — Club contacts, Hall of Fame inductees, and embedded Google Forms

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js (Pages Router) |
| Language | TypeScript |
| UI | Material UI (MUI) + Emotion |
| Content | MDX |
| Data | YAML files (via `next-plugin-yaml`) |
| Data Fetching | TanStack Query |
| Payments | PayPal (`@paypal/react-paypal-js`) |
| Deployment | Netlify (static export) |
| Testing | Vitest |

## Getting Started

### Prerequisites

- Node.js 24 (see `.nvmrc`)
- npm

### Install and Run

```bash
npm install
npm run dev
```

The development server starts at [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
```

Outputs a static site to the `build/` directory.

### Other Commands

```bash
npm run lint    # Lint the codebase
npm test        # Run tests
npm run netlify # Start Netlify dev server (with serverless functions)
```

## Environment Variables

Create a `.env` file in the project root:

```
PAYPAL_CLIENT_ID=<your_paypal_client_id>
PAYPAL_CLIENT_SECRET=<your_paypal_client_secret>
```

## Project Structure

```
pages/                  # Route definitions (mix of .tsx and .mdx)
src/
  components/           # Shared UI components (AdminPage, CalendarCard, Paypal, Scores, etc.)
  data/                 # YAML data files (store, events, links, forms, stats, gauntlet)
  types/                # TypeScript type definitions
  utils/                # Helpers (theme, stats, markdown, analytics, etc.)
  __tests__/            # Test files
netlify/functions/       # Serverless functions for admin CRUD and gauntlet submissions
scripts/                # Python utility scripts for PayPal reporting
docs/                   # Agent documentation
```

## How It Works

Content is stored in YAML files under `src/data/` and imported as ES modules at build time. This gives human-readable, version-controlled data without a CMS.

The admin panel lets staff edit data through the web UI. Changes are submitted via Netlify serverless functions, which use the GitHub API to open a pull request — ensuring all content goes through code review before merging.


