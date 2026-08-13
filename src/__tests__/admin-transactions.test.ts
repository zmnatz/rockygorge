import { describe, it, expect } from 'vitest';
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../../netlify/functions/admin-transactions';
import {
  authenticatedContext,
  emptyContext,
  unauthenticatedContext,
} from './helpers/netlify-context';

function getEvent(query: Record<string, string> = {}): APIGatewayProxyEvent {
  return {
    httpMethod: 'GET',
    queryStringParameters: query,
  } as unknown as APIGatewayProxyEvent;
}

describe('admin-transactions handler', () => {
  it('returns 401 when the request has no authenticated user', async () => {
    const response = await handler(getEvent(), unauthenticatedContext());

    expect(response.statusCode).toBe(401);
    expect(response.body).toContain('Authentication required');
  });

  it('returns 401 when clientContext is absent', async () => {
    const response = await handler(getEvent(), emptyContext());

    expect(response.statusCode).toBe(401);
  });

  it('returns 405 for non-GET requests', async () => {
    const response = await handler(
      { httpMethod: 'POST' } as unknown as APIGatewayProxyEvent,
      authenticatedContext(),
    );

    expect(response.statusCode).toBe(405);
  });

  it('returns a structured 400 for an invalid range once authenticated', async () => {
    const response = await handler(
      getEvent({ start: '2026-05-31', end: '2026-05-01' }),
      authenticatedContext(),
    );

    expect(response.statusCode).toBe(400);
    expect(response.body).toContain('start must not be after end');
  });
});
