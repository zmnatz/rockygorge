---
name: netlify-functions-expert
description: Use ONLY when creating or editing Netlify functions in `netlify/functions/`.
---

# Netlify Functions Expert

This skill manages the serverless functions deployed via Netlify.

## Guidelines
- **Location**: Store all function handlers in the `netlify/functions/` directory.
- **Language**: Use TypeScript (`.ts`) for all functions to maintain type safety.
- **Naming**: Use kebab-case for function filenames (e.g., `admin-calendar.ts`).
- **Handler Pattern**: Follow the standard Netlify function signature: `export const handler = async (event, context) => { ... }`.
- **Integration**: Ensure that function endpoints are correctly referenced in the frontend (e.g., using `/.netlify/functions/function-name`).
- **Configuration**: Check `netlify.toml` for any specific build settings or redirects that might affect function behavior.
