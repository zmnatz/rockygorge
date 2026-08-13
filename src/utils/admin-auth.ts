import type { APIGatewayProxyResult } from 'aws-lambda';
import type { NetlifyFunctionContext } from '../../src/types/netlify-context';

export const AUTH_REQUIRED_MESSAGE =
  'Authentication required. Sign in to the Admin Console and try again.';

/** Returns the 401 response when the request carries no authenticated Netlify
 *  Identity user; returns null when it does. */
export function requireAuth(context: NetlifyFunctionContext): APIGatewayProxyResult | null {
  if (context.clientContext?.user) return null;
  return {
    statusCode: 401,
    body: JSON.stringify({ error: AUTH_REQUIRED_MESSAGE }),
  };
}

export function methodNotAllowed(): APIGatewayProxyResult {
  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method Not Allowed' }),
  };
}

export function internalServerError(error: unknown, prefix = ''): APIGatewayProxyResult {
  if (prefix) {
    console.error(`${prefix}:`, error);
  } else {
    console.error(error);
  }
  return {
    statusCode: 500,
    body: JSON.stringify({ error: error instanceof Error ? error.message : 'Internal Server Error' }),
  };
}
