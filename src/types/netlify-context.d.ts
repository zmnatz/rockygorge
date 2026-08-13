/**
 * The Netlify function context Netlify injects into a function's second
 * argument when the request carries a valid Identity JWT in the `Authorization`
 * header. Shared by the admin Netlify functions.
 */

/** The Netlify Identity user Netlify injects into `clientContext`. */
export interface NetlifyClientContextUser {
  sub?: string;
  email?: string;
  exp?: number;
  [key: string]: unknown;
}

export interface NetlifyClientContext {
  user?: NetlifyClientContextUser | null;
}

export type NetlifyFunctionContext = {
  clientContext?: NetlifyClientContext;
};
