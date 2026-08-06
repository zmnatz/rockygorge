# ADR: Remove typescript-yaml-plugin

## Status

Accepted

## Context

TypeScript v7 (7.0.2) replaced the TypeScript compiler and language service with a native Go implementation (`tsgo`). It no longer ships the JavaScript language-service API that language plugins depend on.

The `typescript-yaml-plugin` (v1.0.11) relied on that API. An empirical probe against TS 7.0.2 showed every API the plugin needs is absent: `ScriptSnapshot`, `Extension.Ts`, `ScriptKind.TS`, `createLanguageService`, `getTokenAtPosition`, `isModuleSpecifierLike`, and `ScriptElementKind.scriptElement` are all `undefined`. The plugin cannot load under TS 7.

Additionally, Next.js ≤ 16.2.x crashes with TS 7 (`The "id" argument must be of type string. Received undefined`) because it probes for the missing `typescript/lib/typescript.js` file and misdetects TS as absent. Next.js 16.3.0 supports TS 7 via `experimental.useTypeScriptCli`.

## Decision

- Upgrade TypeScript to v7 (pinned as `^7.0.2`).
- Remove `typescript-yaml-plugin` from `package.json` and drop the `plugins` entry from `tsconfig.json`.
- Upgrade `next` and `eslint-config-next` to 16.3.0 and enable `experimental.useTypeScriptCli: true` in `next.config.ts`.

## Consequences

- `tsc --noEmit`, the full test suite, lint, and `next build` all pass under TS 7.
- YAML editor completion/shape-checking for `@content/*.yml` and `@config/*.yml` from the plugin is gone. The hand-authored declarations in `src/types/yaml.d.ts` still type `@content/*.yml`. `@config/*.yml` has never had hand-authored declarations and already resolved to `any` under `tsc --noEmit` (the plugin only ran in editors, never in the CLI typecheck gate), so the repo's pre-commit gate is unchanged.
- `experimental.useTypeScriptCli` is a Next experimental flag; if a future Next release renames or removes it, that upgrade must revisit this configuration.
