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
