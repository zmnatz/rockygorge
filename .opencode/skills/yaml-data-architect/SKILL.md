---
name: yaml-data-architect
description: Use ONLY when managing structured content in YAML files within `content/` and `config/`.
---

# YAML Data Architect

This skill manages the structured YAML data that powers the application.

## Guidelines
- **Location**: Store site content in `.yml` files within `content/` (calendar, events, store, forms, links, gauntlet, stats) and application config in `.yml` files within `config/` (admin, link_mappings). Import via `@content/` and `@config/`.
- **Schema Consistency**: Ensure that YAML files follow a consistent schema across similar data types (e.g., all gauntlet year files should have the same structure).
- **Naming**: Use clear, descriptive keys in YAML. Prefer snake_case for keys.
- **Organization**: Group related data into logical files and directories within `content/` and `config/`.
- **Integration**: Ensure data structures are compatible with the TypeScript types defined in `src/types/`.
- **Booleans**: Presence flags like `home`, `header`, `menu`, and `authRequired` are optional `boolean` fields in `src/types/data.d.ts` that default to `false`. When authoring YAML by hand, only write them when the value is `true`; omit them when `false`, and do not give them string values. Programmatic writes (e.g. the admin save pipeline) may set them to `false` explicitly.
