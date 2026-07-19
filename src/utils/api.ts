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

export function get<T>(url: string): Promise<T> {
  return request<T>(url);
}

export function post<T>(url: string, body: unknown): Promise<T> {
  return request<T>(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function createPaypalOrder(description: string, amount: string): Promise<{ orderId: string }> {
  return post<{ orderId: string }>("/.netlify/functions/paypal-order", {
    action: "create",
    description,
    amount,
  });
}

export function capturePaypalOrder(orderId: string): Promise<void> {
  return post<void>("/.netlify/functions/paypal-order", {
    action: "capture",
    orderId,
  });
}
