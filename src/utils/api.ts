const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...DEFAULT_HEADERS,
      ...options.headers,
    },
  });

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

// POST with exponential backoff for transient failures (429 rate limits,
// 5xx, network errors). Other 4xx errors throw immediately.
export async function postWithRetry<T>(
  url: string,
  body: unknown,
  accessToken?: string | null,
  options?: RetryOptions
): Promise<T> {
  const retries = options?.retries ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 1000;

  for (let attempt = 0; ; attempt++) {
    const startedAt = Date.now();
    requestStats.requests += 1;
    try {
      return await post<T>(url, body, accessToken);
    } catch (error) {
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
