---
name: typescript-type-manager
description: Use ONLY when defining or refactoring TypeScript interfaces and types in `src/types/`.
---

# TypeScript Type Manager

This skill maintains the type safety and integrity of the project's TypeScript definitions.

## Guidelines
- **Location**: Define shared types and interfaces in `src/types/`. Avoid defining complex types inside component files.
- **Naming**: Use PascalCase for types and interfaces. Avoid using the `I` prefix (e.g., use `User` instead of `IUser`).
- **Type Safety**: Prefer `interface` for object definitions and `type` for unions or aliases.
- **Generics**: Use generics to create reusable and flexible types where appropriate.
- **Consistency**: Ensure that types for YAML data match the actual structure of the `.yml` files in `src/data/`.
