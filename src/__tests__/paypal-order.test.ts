import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  process.env.PAYPAL_CLIENT_ID = 'test-client-id';
  process.env.PAYPAL_CLIENT_SECRET = 'test-secret';
  process.env.PAYPAL_ENV = 'sandbox';
});

function mockTokenResponse() {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ access_token: 'test-token', expires_in: 3600 }),
  });
}

function mockCreateOrderResponse(orderId = 'ORDER-123') {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ id: orderId, status: 'CREATED' }),
  });
}

function mockCaptureOrderResponse() {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ id: 'ORDER-123', status: 'COMPLETED' }),
  });
}

async function importHandler() {
  const mod = await import('../../netlify/functions/paypal-order');
  return mod.handler;
}

function makeEvent(body: object, method = 'POST') {
  return { httpMethod: method, body: JSON.stringify(body) };
}

describe('paypal-order handler', () => {
  describe('method validation', () => {
    it('returns 405 for GET requests', async () => {
      const handler = await importHandler();
      const result = await handler(makeEvent({}, 'GET'));
      expect(result.statusCode).toBe(405);
    });

    it('returns 405 for PUT requests', async () => {
      const handler = await importHandler();
      const result = await handler(makeEvent({}, 'PUT'));
      expect(result.statusCode).toBe(405);
    });
  });

  describe('action validation', () => {
    it('returns 400 for unknown action', async () => {
      const handler = await importHandler();
      const result = await handler(makeEvent({ action: 'refund' }));
      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe('Invalid action');
    });
  });

  describe('create action', () => {
    it('returns 400 when description is missing', async () => {
      const handler = await importHandler();
      const result = await handler(makeEvent({ action: 'create', amount: '50' }));
      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe('Missing description or amount');
    });

    it('returns 400 when amount is missing', async () => {
      const handler = await importHandler();
      const result = await handler(makeEvent({ action: 'create', description: 'Test' }));
      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe('Missing description or amount');
    });

    it('creates an order and returns orderId', async () => {
      mockTokenResponse();
      mockCreateOrderResponse('ORDER-ABC');

      const handler = await importHandler();
      const result = await handler(makeEvent({
        action: 'create',
        description: 'Banquet Tickets',
        amount: '100',
      }));

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({ orderId: 'ORDER-ABC' });
    });

    it('sends correct request to PayPal orders API', async () => {
      mockTokenResponse();
      mockCreateOrderResponse();

      const handler = await importHandler();
      await handler(makeEvent({
        action: 'create',
        description: 'Team Gear',
        amount: '25',
      }));

      const ordersCall = mockFetch.mock.calls[1];
      expect(ordersCall[0]).toBe('https://api-m.sandbox.paypal.com/v2/checkout/orders');
      expect(ordersCall[1].method).toBe('POST');
      expect(ordersCall[1].headers.Authorization).toBe('Bearer test-token');

      const body = JSON.parse(ordersCall[1].body);
      expect(body.intent).toBe('CAPTURE');
      expect(body.purchase_units[0].description).toBe('Team Gear');
      expect(body.purchase_units[0].amount).toEqual({
        currency_code: 'USD',
        value: '25',
      });
    });

    it('returns 500 when PayPal API fails', async () => {
      mockTokenResponse();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('INVALID_REQUEST'),
      });

      const handler = await importHandler();
      const result = await handler(makeEvent({
        action: 'create',
        description: 'Test',
        amount: '10',
      }));

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toContain('Failed to create PayPal order');
    });
  });

  describe('capture action', () => {
    it('returns 400 when orderId is missing', async () => {
      const handler = await importHandler();
      const result = await handler(makeEvent({ action: 'capture' }));
      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe('Missing orderId');
    });

    it('captures an order and returns result', async () => {
      mockTokenResponse();
      mockCaptureOrderResponse();

      const handler = await importHandler();
      const result = await handler(makeEvent({ action: 'capture', orderId: 'ORDER-123' }));

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({ id: 'ORDER-123', status: 'COMPLETED' });
    });

    it('sends correct request to PayPal capture API', async () => {
      mockTokenResponse();
      mockCaptureOrderResponse();

      const handler = await importHandler();
      await handler(makeEvent({ action: 'capture', orderId: 'ORDER-XYZ' }));

      const captureCall = mockFetch.mock.calls[1];
      expect(captureCall[0]).toBe('https://api-m.sandbox.paypal.com/v2/checkout/orders/ORDER-XYZ/capture');
      expect(captureCall[1].method).toBe('POST');
      expect(captureCall[1].headers.Authorization).toBe('Bearer test-token');
    });

    it('returns 500 when capture fails', async () => {
      mockTokenResponse();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: () => Promise.resolve('ORDER_ALREADY_CAPTURED'),
      });

      const handler = await importHandler();
      const result = await handler(makeEvent({ action: 'capture', orderId: 'ORDER-123' }));

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toContain('Failed to capture PayPal order');
    });
  });

  describe('token caching', () => {
    it('reuses cached token for subsequent requests', async () => {
      mockTokenResponse();
      mockCreateOrderResponse('O1');
      mockCreateOrderResponse('O2');

      const handler = await importHandler();
      await handler(makeEvent({ action: 'create', description: 'A', amount: '10' }));
      await handler(makeEvent({ action: 'create', description: 'B', amount: '20' }));

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(mockFetch.mock.calls[0][0]).toContain('/v1/oauth2/token');
      expect(mockFetch.mock.calls[1][0]).toContain('/v2/checkout/orders');
      expect(mockFetch.mock.calls[2][0]).toContain('/v2/checkout/orders');
    });
  });

  describe('authentication', () => {
    it('returns 500 when credentials are missing', async () => {
      delete process.env.PAYPAL_CLIENT_ID;
      delete process.env.PAYPAL_CLIENT_SECRET;

      const handler = await importHandler();
      const result = await handler(makeEvent({
        action: 'create',
        description: 'Test',
        amount: '10',
      }));

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toBe('Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET');
    });

    it('sends base64-encoded credentials in token request', async () => {
      mockTokenResponse();
      mockCreateOrderResponse();

      const handler = await importHandler();
      await handler(makeEvent({ action: 'create', description: 'T', amount: '5' }));

      const tokenCall = mockFetch.mock.calls[0];
      const expectedAuth = Buffer.from('test-client-id:test-secret').toString('base64');
      expect(tokenCall[1].headers.Authorization).toBe(`Basic ${expectedAuth}`);
    });
  });

  describe('environment', () => {
    it('uses production URL by default', async () => {
      delete process.env.PAYPAL_ENV;
      mockTokenResponse();
      mockCreateOrderResponse();

      const handler = await importHandler();
      await handler(makeEvent({ action: 'create', description: 'T', amount: '5' }));

      expect(mockFetch.mock.calls[0][0]).toContain('https://api-m.paypal.com');
    });

    it('uses sandbox URL when PAYPAL_ENV is sandbox', async () => {
      process.env.PAYPAL_ENV = 'sandbox';
      mockTokenResponse();
      mockCreateOrderResponse();

      const handler = await importHandler();
      await handler(makeEvent({ action: 'create', description: 'T', amount: '5' }));

      expect(mockFetch.mock.calls[0][0]).toContain('https://api-m.sandbox.paypal.com');
    });
  });
});
