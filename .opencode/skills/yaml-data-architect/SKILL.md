---
name: yaml-data-architect
description: Use ONLY when managing structured content in YAML files within `src/data/`.
---

# YAML Data Architect

This skill manages the structured YAML data that powers the content of the application.

## Guidelines
- **Location**: Store all structured data in `.yml` files within `src/data/`.
- **Schema Consistency**: Ensure that YAML files follow a consistent schema across similar data types (e.g., all gauntlet year files should have the same structure).
- **Naming**: Use clear, descriptive keys in YAML. Prefer snake_case for keys.
- **Organization**: Group related data into logical files and directories within `src/data/`.
- **Integration**: Ensure data structures are compatible with the TypeScript types defined in `src/types/`.
