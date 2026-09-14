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

function statusFromError(error: unknown): number | undefined {
  const match = String((error as Error)?.message ?? '').match(
    /Request failed: (\d{3})/
  );
  return match ? parseInt(match[1], 10) : undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    try {
      return await post<T>(url, body, accessToken);
    } catch (error) {
      const status = statusFromError(error);
      const retryable =
        status === undefined || status === 429 || status >= 500;
      if (!retryable || attempt >= retries) {
        throw error;
      }
      await sleep(baseDelayMs * 2 ** attempt + Math.random() * 250);
    }
  }
}
