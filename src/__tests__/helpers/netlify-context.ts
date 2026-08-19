import type { NetlifyFunctionContext } from '@/types/netlify-context';

/** A request context carrying an authenticated Netlify Identity user. */
export function authenticatedContext(
  user: Record<string, unknown> = { sub: 'user-1' },
): NetlifyFunctionContext {
  return { clientContext: { user } };
}

/** A request context with an explicit unauthenticated user. */
export function unauthenticatedContext(): NetlifyFunctionContext {
  return { clientContext: { user: null } };
}

/** A request context with no clientContext at all. */
export function emptyContext(): NetlifyFunctionContext {
  return {};
}
