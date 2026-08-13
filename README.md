# Rocky Gorge Rugby

The official website for [Rocky Gorge Rugby Football Club](https://rockygorgerugby.com) — a premier men's rugby club based in Columbia, Maryland. The club competes in Division I and Division III men's rugby and is a 2012 & 2014 Division II National Champion and 2025 Division III Atlantic Super Regional Champion.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](https://www.contributor-covenant.org/version/2/1/code_of_conduct.html)

This project is [MIT licensed](LICENSE) and governed by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Features

- **Online Store** — Purchase banquet tickets, golf outing packages, donations, player dues, gear, and sponsorships via PayPal
- **Statistics Dashboard** — Per-game and season-aggregated player and team stats with sortable, filterable views
- **Gauntlet Challenge** — Fitness leaderboard for the rowing/erg challenge with player submissions
- **Calendar** — Live Google Calendar integration showing training, matches, and events
- **Admin Panel** — Data-driven CRUD interface for managing store items, events, links, forms, calendar filters, link mappings, and the homepage via GitHub PRs, plus a PayPal transactions report
- **Content Pages** — Club contacts, Hall of Fame inductees, and embedded Google Forms

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js (Pages Router) |
| Language | TypeScript |
| UI | Material UI (MUI) + Emotion |
| Content | MDX |
| Data | YAML files (via `yaml-loader` + Turbopack) |
| Data Fetching | TanStack Query |
| Payments | PayPal (`@paypal/react-paypal-js`) |
| Deployment | Netlify (static export) |
| Testing | Vitest |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) 1.3.14 (pinned via `packageManager` in `package.json`)

### Install and Run

```bash
bun install
bun run dev
```

The development server starts at [http://localhost:3000](http://localhost:3000).

### Build

```bash
bun run build
```

Outputs a static site to the `build/` directory.

### Other Commands

```bash
bun run lint    # Lint the codebase (Biome)
bun run test    # Run tests (Vitest)
bun run netlify # Start Netlify dev server (with serverless functions)
```

## Environment Variables

`PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are the PayPal REST app credentials used by the
`admin-transactions` Netlify function (the PayPal Transaction Search API). They are configured as
**Netlify environment variables** and never leave the server — there is no local `.env` requirement.

## Project Structure

```
pages/                  # Route definitions (mix of .tsx and .mdx)
content/                # YAML site data (events, calendar, store, forms, links, gauntlet, stats)
config/                 # YAML application configuration (admin, link_mappings)
src/
  components/           # Shared UI components (AdminPage, CalendarCard, Paypal, Scores, etc.)
  types/                # TypeScript type definitions
  utils/                # Helpers (theme, stats, markdown, analytics, etc.)
  __tests__/            # Test files
netlify/functions/       # Serverless functions for admin CRUD, gauntlet submissions, and the PayPal transactions report
docs/                   # Agent documentation
```

## How It Works

Content is stored in YAML files under `content/` and `config/` and imported as ES modules at build time. This gives human-readable, version-controlled data without a CMS.

The admin panel lets staff edit data through the web UI. Changes are submitted via Netlify serverless functions, which use the GitHub API to open a pull request — ensuring all content goes through code review before merging.


