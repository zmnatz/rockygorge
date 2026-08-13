import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import type { PaypalRawTransaction, PaypalTransaction } from '../../src/types/paypal';
import {
  PAGE_SIZE,
  REPORTING_SCOPE,
  buildDateWindows,
  flattenTransaction,
  validateRange,
} from './paypal-transactions';

export const config = {
  path: '/api/admin-transactions',
};

const PAYPAL_TOKEN_URL = 'https://api-m.paypal.com/v1/oauth2/token';
const TRANSACTIONS_URL = 'https://api-m.paypal.com/v1/reporting/transactions';

/** The Netlify Identity user Netlify injects into `clientContext` when the
 *  request carries a valid Identity JWT in the `Authorization` header. */
interface NetlifyClientContextUser {
  sub?: string;
  email?: string;
  exp?: number;
  [key: string]: unknown;
}

interface NetlifyClientContext {
  user?: NetlifyClientContextUser | null;
}

type NetlifyFunctionContext = {
  clientContext?: NetlifyClientContext;
};

const MISSING_SCOPE_MESSAGE =
  "PayPal Transaction Search is not enabled for this app. Enable 'Transaction Search' under " +
  'Features in the PayPal Developer Dashboard, then retry - the toggle can take a while to ' +
  'propagate to new tokens.';

class PaypalScopeError extends Error {
  constructor() {
    super(MISSING_SCOPE_MESSAGE);
  }
}

interface PaypalTokenResponse {
  access_token?: string;
  scope?: string;
}

interface PaypalListTransactionsResponse {
  transaction_details?: PaypalRawTransaction[];
  total_pages?: number;
}

interface PaypalListParams {
  start: string;
  end: string;
}

async function getAccessToken(clientId: string, clientSecret: string): Promise<PaypalTokenResponse> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(PAYPAL_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = (await response.json()) as PaypalTokenResponse;
  if (!response.ok || !data.access_token) {
    throw new Error(`PayPal authentication failed (${response.status}).`);
  }
  return data;
}

async function fetchTransactionsPage(
  token: string,
  params: PaypalListParams,
  page: number,
): Promise<PaypalListTransactionsResponse> {
  const query = new URLSearchParams({
    start_date: params.start,
    end_date: params.end,
    fields: 'all',
    page_size: String(PAGE_SIZE),
    page: String(page),
  });
  const response = await fetch(`${TRANSACTIONS_URL}?${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`PayPal API error ${response.status}: ${body}`);
  }
  return (await response.json()) as PaypalListTransactionsResponse;
}

async function fetchTransactions(token: string, start: string, end: string): Promise<PaypalTransaction[]> {
  const raw: PaypalRawTransaction[] = [];

  for (const window of buildDateWindows(start, end)) {
    let page = 1;
    let totalPages = 1;
    do {
      const data = await fetchTransactionsPage(token, { start: window.start, end: window.end }, page);
      raw.push(...(data.transaction_details ?? []));
      totalPages = data.total_pages ?? 1;
      page += 1;
    } while (page <= totalPages);
  }

  return raw.map(flattenTransaction);
}

export const handler = async (
  event: APIGatewayProxyEvent,
  context: NetlifyFunctionContext,
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  if (!context.clientContext?.user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Authentication required. Sign in to the Admin Console and try again.' }),
    };
  }

  const query = event.queryStringParameters ?? {};
  const validation = validateRange(query.start, query.end);
  if (validation.ok === false) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: validation.error }),
    };
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are not configured.',
      }),
    };
  }

  try {
    const token = await getAccessToken(clientId, clientSecret);
    if (!token.scope?.split(/\s+/).includes(REPORTING_SCOPE)) {
      throw new PaypalScopeError();
    }

    const transactions = await fetchTransactions(token.access_token, validation.start, validation.end);
    return {
      statusCode: 200,
      body: JSON.stringify({ transactions }),
    };
  } catch (error) {
    if (error instanceof PaypalScopeError) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: error.message }),
      };
    }
    console.error('admin-transactions:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error instanceof Error ? error.message : 'Internal Server Error' }),
    };
  }
}
