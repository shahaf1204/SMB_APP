import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MetaOAuthError } from './metaOAuth.errors';
import {
  assertAttemptNotStaleForConnection,
  assertMetaPageAvailableForBusiness,
  finalizeMetaConnectionWithSubscription,
} from './metaConnection.service';

vi.mock('../../core/supabase.server', () => ({
  getSupabaseAdminOptional: vi.fn(),
}));

vi.mock('./metaGraph.client', () => ({
  subscribeMetaPageToLeadgen: vi.fn(),
}));

import { getSupabaseAdminOptional } from '../../core/supabase.server';
import { subscribeMetaPageToLeadgen } from './metaGraph.client';

describe('metaConnection.service stale attempt guard', () => {
  it('X. stale attempt cannot overwrite newer connected row', () => {
    expect(() =>
      assertAttemptNotStaleForConnection(
        '2026-01-01T00:00:00.000Z',
        '2026-01-02T00:00:00.000Z',
        'connected',
      ),
    ).toThrow(MetaOAuthError);
  });

  it('allows completion when connection unchanged since attempt baseline', () => {
    expect(() =>
      assertAttemptNotStaleForConnection(
        '2026-01-02T00:00:00.000Z',
        '2026-01-01T00:00:00.000Z',
        'connected',
      ),
    ).not.toThrow();
  });
});

describe('assertMetaPageAvailableForBusiness', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.INTEGRATION_ENCRYPTION_KEY = 'page-ownership-key';
  });

  it('A. rejects page owned by another business', async () => {
    vi.mocked(getSupabaseAdminOptional).mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { business_id: 'biz-other', connection_status: 'connected', is_active: true },
                }),
              }),
            }),
          }),
        }),
      }),
    } as never);

    await expect(assertMetaPageAvailableForBusiness('page-x', 'biz-me')).rejects.toMatchObject({
      code: 'page_already_connected',
    });
  });

  it('B. allows same business reconnect', async () => {
    vi.mocked(getSupabaseAdminOptional).mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { business_id: 'biz-me', connection_status: 'connected', is_active: true },
                }),
              }),
            }),
          }),
        }),
      }),
    } as never);

    await expect(assertMetaPageAvailableForBusiness('page-x', 'biz-me')).resolves.toBeUndefined();
  });
});

describe('finalizeMetaConnectionWithSubscription reconnect safety', () => {
  beforeEach(() => {
    process.env.INTEGRATION_ENCRYPTION_KEY = 'finalize-key';
    vi.mocked(subscribeMetaPageToLeadgen).mockReset();
  });

  it('C. healthy connection not overwritten when subscription fails', async () => {
    const updates: unknown[] = [];
    let selectCall = 0;
    const eqChain = {
      eq: vi.fn(function () {
        return eqChain;
      }),
      order: vi.fn(() => eqChain),
      limit: vi.fn(() => eqChain),
      maybeSingle: async () => {
        selectCall += 1;
        if (selectCall === 1) {
          return { data: null };
        }
        return {
          data: {
            id: 'conn-1',
            page_id: 'p-old',
            page_name: 'Old',
            connection_status: 'connected',
            is_active: true,
            webhook_subscribed_at: '2026-01-01T00:00:00.000Z',
            access_token_encrypted: 'v1:old',
          },
        };
      },
    };
    vi.mocked(getSupabaseAdminOptional).mockReturnValue({
      from: (table: string) => {
        if (table !== 'meta_connections') throw new Error(table);
        return {
          select: () => eqChain,
          update: (patch: unknown) => ({
            eq: async () => {
              updates.push(patch);
              return { error: null };
            },
          }),
        };
      },
    } as never);

    vi.mocked(subscribeMetaPageToLeadgen).mockRejectedValue(new Error('Graph 500 access_token=SECRET'));

    await expect(
      finalizeMetaConnectionWithSubscription({
        userId: 'u1',
        businessId: 'biz-1',
        pageId: 'p-new',
        pageName: 'New',
        pageAccessToken: 'new-token',
      }),
    ).rejects.toMatchObject({ code: 'page_subscription_failed' });

    expect(updates).toHaveLength(0);
  });
});
