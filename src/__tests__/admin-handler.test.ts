import { describe, it, expect } from 'vitest';
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { createAdminHandler } from '../../netlify/functions/admin-handler';
import { emptyContext, unauthenticatedContext } from './helpers/netlify-context';

const handler = createAdminHandler({
  filePath: 'content/test.yml',
  branchPrefix: 'admin-test',
  label: 'test',
});

function postEvent(): APIGatewayProxyEvent {
  return {
    httpMethod: 'POST',
    body: '{}',
  } as unknown as APIGatewayProxyEvent;
}

describe('createAdminHandler', () => {
  it('returns 401 when the request has no authenticated user', async () => {
    const response = await handler(postEvent(), unauthenticatedContext());

    expect(response.statusCode).toBe(401);
    expect(response.body).toContain('Authentication required');
  });

  it('returns 401 when clientContext is absent', async () => {
    const response = await handler(postEvent(), emptyContext());

    expect(response.statusCode).toBe(401);
  });

  it('returns 405 for non-POST requests', async () => {
    const response = await handler(
      { httpMethod: 'GET' } as unknown as APIGatewayProxyEvent,
      {},
    );

    expect(response.statusCode).toBe(405);
  });
});
