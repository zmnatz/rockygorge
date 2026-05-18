---
name: tanstack-query-optimizer
description: Use ONLY when implementing or optimizing data fetching, caching, and state management using TanStack Query.
---

# TanStack Query Optimizer

This skill focuses on efficient data fetching and state management using TanStack Query (React Query).

## Guidelines
- **Query Keys**: Use consistent, hierarchical query keys (e.g., `['gauntlet', 'year', 2025]`) to enable precise cache invalidation.
- **Custom Hooks**: Wrap queries and mutations in custom hooks (e.g., `useGauntletData`) to encapsulate logic and reuse across components.
- **Caching**: Configure appropriate `staleTime` and `gcTime` based on how frequently the data changes.
- **Error Handling**: Implement robust error handling using the `onError` callback or Error Boundaries.
- **Performance**: Use `select` in `useQuery` to transform data and reduce unnecessary re-renders.
