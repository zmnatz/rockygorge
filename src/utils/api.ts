const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

// The CMS sits behind a rate limiter (Stellate) that allows each IP a budget of
// 500 requests, refilling at about 4 a second, and blocked requests use it too.
// Every answer reports the budget left, so all requests share one gate: when
// little is left they wait together for it to refill, rather than each one
// running into 429s. Found in the usa-club-rugby-eligibility project.
const RATE_LIMIT_RESERVE = 20;
let pausedUntil = 0;

/** The request budget a response reports, if it does. */
export function rateLimitBudget(header: string | null): { remaining: number; refillSeconds: number } | null {
  const rule = header?.split(/,\s*(?=")/).find((part) => part.includes('RequestCount'));
  const remaining = rule?.match(/remaining=(\d+)/)?.[1];
  const refill = rule?.match(/refill=(\d+)/)?.[1];
  return remaining === undefined ? null : { remaining: Number(remaining), refillSeconds: Number(refill ?? 1) };
}

function pauseFor(ms: number): void {
  pausedUntil = Math.max(pausedUntil, Date.now() + ms);
}

async function waitForBudget(): Promise<void> {
  while (Date.now() < pausedUntil) {
    const wait = pausedUntil - Date.now();
    requestStats.waitMs += wait;
    await sleep(wait);
  }
}

/** A request the rate limiter turned away, and how long it asked to wait. */
export class RateLimitedError extends Error {
  constructor(readonly retryAfterMs: number) {
    super('Request failed: 429');
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  await waitForBudget();
  const response = await fetch(url, {
    ...options,
    headers: {
      ...DEFAULT_HEADERS,
      ...options.headers,
    },
  });

  const budget = rateLimitBudget(response.headers?.get('stellate-rate-limit-rules') ?? null);
  if (response.status === 429) {
    const retryAfterMs = (Number(response.headers?.get('retry-after')) || budget?.refillSeconds || 5) * 1000;
    pauseFor(retryAfterMs);
    throw new RateLimitedError(retryAfterMs);
  }
  if (budget && budget.remaining < RATE_LIMIT_RESERVE) {
    // About 4 requests come back a second, so a few seconds restores the reserve.
    pauseFor(Math.max(budget.refillSeconds, 3) * 1000);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Request failed: ${response.status}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : (undefined as T);
}

export function get<T>(url: string, accessToken?: string | null): Promise<T> {
  const headers: Record<string, string> = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return request<T>(url, { headers });
}

export function post<T>(url: string, body: unknown, accessToken?: string | null): Promise<T> {
  const headers: Record<string, string> = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return request<T>(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers,
  });
}

interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
}

/** Counts for the current process, so a snapshot job can report where its time went. */
export const requestStats = { requests: 0, retries: 0, waitMs: 0, requestMs: 0 };

export function resetRequestStats(): void {
  Object.assign(requestStats, { requests: 0, retries: 0, waitMs: 0, requestMs: 0 });
}

function statusFromError(error: unknown): number | undefined {
  const match = String((error as Error)?.message ?? '').match(
    /Request failed: (\d{3})/
  );
  return match ? parseInt(match[1], 10) : undefined;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Maps over items with at most `limit` running at once, keeping the order given so
// the output doesn't depend on which finishes first.
export async function mapConcurrent<Item, Result>(
  items: Item[],
  limit: number,
  run: (item: Item) => Promise<Result>
): Promise<Result[]> {
  const results = new Array<Result>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await run(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/** How many times one request waits out the rate limit before giving up. */
const RATE_LIMIT_WAITS = 10;

// POST with exponential backoff for transient failures (5xx, network errors).
// A 429 waits for the limiter's Retry-After, through the shared gate, without
// using up a retry. Other 4xx errors throw immediately.
export async function postWithRetry<T>(
  url: string,
  body: unknown,
  accessToken?: string | null,
  options?: RetryOptions
): Promise<T> {
  const retries = options?.retries ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 1000;
  let rateLimitWaits = 0;

  for (let attempt = 0; ; attempt++) {
    const startedAt = Date.now();
    requestStats.requests += 1;
    try {
      return await post<T>(url, body, accessToken);
    } catch (error) {
      if (error instanceof RateLimitedError && rateLimitWaits < RATE_LIMIT_WAITS) {
        rateLimitWaits += 1;
        attempt -= 1;
        requestStats.retries += 1;
        continue;
      }
      const status = statusFromError(error);
      const retryable =
        status === undefined || status === 429 || status >= 500;
      if (!retryable || attempt >= retries) {
        throw error;
      }
      const delay = baseDelayMs * 2 ** attempt + Math.random() * 250;
      requestStats.retries += 1;
      requestStats.waitMs += delay;
      await sleep(delay);
    } finally {
      requestStats.requestMs += Date.now() - startedAt;
    }
  }
}
