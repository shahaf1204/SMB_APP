import { describe, expect, it } from 'vitest';
import type { MetaConnection } from './crm';

describe('MetaConnection client-safe shape', () => {
  it('K. MetaConnection type has no token fields', () => {
    const sample: MetaConnection = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      ownerId: '550e8400-e29b-41d4-a716-446655440001',
      businessId: 'biz-1',
      pageId: '123456',
      pageName: 'My Page',
      isActive: true,
      connectionStatus: 'connected',
      lastError: undefined,
      lastLeadReceivedAt: '2026-01-01T00:00:00.000Z',
      webhookSubscribedAt: undefined,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const keys = Object.keys(sample).sort();
    expect(keys).not.toContain('accessToken');
    expect(keys).not.toContain('access_token_encrypted');
    expect(JSON.stringify(sample)).not.toMatch(/token/i);
  });
});
