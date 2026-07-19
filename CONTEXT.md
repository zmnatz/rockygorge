# Domain Glossary: Rocky Gorge

## Content

**Content** refers to YAML data files that define what users see on the site — event listings, calendar configuration, store items, form embeds, navigation links, gauntlet leaderboards, and stats. These live in `content/` at the repo root and are imported via the `@content/*` alias.

Files: `calendar.yml`, `events.yml`, `store.yml`, `forms.yml`, `links.yml`, `gauntlet/`, `stats/`

## Config

**Config** refers to YAML data files that drive application behavior — admin page definitions, link text mappings, and other settings that control how the app processes data rather than what it displays. These live in `config/` at the repo root and are imported via the `@config/*` alias.

Files: `admin.yml`, `link_mappings.yml`
