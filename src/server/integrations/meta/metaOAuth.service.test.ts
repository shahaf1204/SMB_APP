import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../core/supabase.server', () => ({
  getSupabaseAdminOptional: vi.fn(() => null),
  getMetaAppSecret: vi.fn(() => 'test-app-secret'),
  getMetaGraphVersion: vi.fn(() => 'v21.0'),
}));

vi.mock('../../core/env.server', () => ({
  deploymentUrlFromEnv: vi.fn(() => 'https://app.example.com'),
  getServerEnv: vi.fn((name: string) => {
    if (name === 'META_APP_ID') return 'app-id';
    return undefined;
  }),
}));

import { getSupabaseAdminOptional } from '../../core/supabase.server';
import * as graph from './metaGraph.client';
import * as connectionService from './metaConnection.service';
import {
  assertNoSecretsInClientPayload,
  completeMetaOAuthPageSelection,
  getSafeMetaOAuthPageCandidates,
  handleMetaOAuthCallback,
  startMetaOAuthAuthorization,
} from './metaOAuth.service';
import {
  createMetaOAuthAttempt,
  createMetaOAuthState,
  resetMetaOAuthMemoryStoreForTests,
} from './metaOAuth.store';
import {
  encryptMetaOAuthPagesPayload,
} from './metaOAuth.pagesPayload';

describe('metaOAuth.service', () => {
  beforeEach(() => {
    resetMetaOAuthMemoryStoreForTests();
    process.env.INTEGRATION_ENCRYPTION_KEY = 'oauth-service-test-key';
    process.env.META_OAUTH_REDIRECT_URI = 'https://app.example.com/api/integrations/meta/oauth/callback';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    resetMetaOAuthMemoryStoreForTests();
  });

  it('A. OAuth start returns authorization URL with state', async () => {
    const { authorizationUrl } = await startMetaOAuthAuthorization({
      userId: 'user-1',
      businessId: 'biz-1',
    });
    expect(authorizationUrl).toContain('facebook.com');
    expect(authorizationUrl).toContain('state=');
  });

  it('G. authorization cancellation redirects safely', async () => {
    const { redirectUrl } = await handleMetaOAuthCallback({ error: 'access_denied' });
    expect(redirectUrl).toContain('meta_oauth_error=user_cancelled');
  });

  it('H/I. successful vs failed code exchange', async () => {
    const state = await createMetaOAuthState('user-1', 'biz-1');

    vi.spyOn(graph, 'exchangeMetaOAuthCode').mockResolvedValue({ access_token: 'short' });
    vi.spyOn(graph, 'exchangeMetaLongLivedUserToken').mockResolvedValue({ access_token: 'long' });
    vi.spyOn(graph, 'fetchMetaUserId').mockResolvedValue('meta-user');
    vi.spyOn(graph, 'fetchMetaManagedPages').mockResolvedValue([
      { id: 'page-1', name: 'Page One', access_token: 'page-token' },
    ]);
    vi.spyOn(connectionService, 'readMetaConnectionBaseline').mockResolvedValue({
      updatedAt: null,
      connectionStatus: null,
    });

    const ok = await handleMetaOAuthCallback({ code: 'code-1', state: state.stateToken });
    expect(ok.redirectUrl).toContain('meta_attempt=');

    const state2 = await createMetaOAuthState('user-1', 'biz-1');
    vi.spyOn(graph, 'exchangeMetaOAuthCode').mockRejectedValue(new Error('exchange boom'));
    const fail = await handleMetaOAuthCallback({ code: 'bad', state: state2.stateToken });
    expect(fail.redirectUrl).toContain('meta_oauth_error=oauth_exchange_failed');
  });

  it('K/L. page discovery returns safe candidates only', async () => {
    const encrypted = encryptMetaOAuthPagesPayload([
      { id: 'p1', name: 'One', access_token: 'secret-page-token' },
    ]);
    const attempt = await createMetaOAuthAttempt({
      userId: 'user-1',
      businessId: 'biz-1',
      metaUserId: 'meta-1',
      pagesPayloadEncrypted: encrypted,
      connectionBaselineAt: null,
    });

    const result = await getSafeMetaOAuthPageCandidates({
      attemptId: attempt.id,
      userId: 'user-1',
      businessId: 'biz-1',
    });

    expect(result.pages).toEqual([{ pageId: 'p1', pageName: 'One' }]);
    expect(() => assertNoSecretsInClientPayload(result)).not.toThrow();
    expect(JSON.stringify(result)).not.toMatch(/secret-page-token/);
  });

  it('M. no pages redirects with no_pages_available', async () => {
    const state = await createMetaOAuthState('user-1', 'biz-1');
    vi.spyOn(graph, 'exchangeMetaOAuthCode').mockResolvedValue({ access_token: 'short' });
    vi.spyOn(graph, 'exchangeMetaLongLivedUserToken').mockResolvedValue({ access_token: 'long' });
    vi.spyOn(graph, 'fetchMetaUserId').mockResolvedValue('meta-user');
    vi.spyOn(graph, 'fetchMetaManagedPages').mockResolvedValue([]);
    vi.spyOn(connectionService, 'readMetaConnectionBaseline').mockResolvedValue({
      updatedAt: null,
      connectionStatus: null,
    });

    const { redirectUrl } = await handleMetaOAuthCallback({ code: 'c', state: state.stateToken });
    expect(redirectUrl).toContain('no_pages_available');
  });

  it('O. arbitrary page rejected', async () => {
    const encrypted = encryptMetaOAuthPagesPayload([
      { id: 'p1', name: 'One', access_token: 'tok' },
    ]);
    const attempt = await createMetaOAuthAttempt({
      userId: 'user-1',
      businessId: 'biz-1',
      metaUserId: 'm',
      pagesPayloadEncrypted: encrypted,
      connectionBaselineAt: null,
    });

    vi.spyOn(connectionService, 'readMetaConnectionBaseline').mockResolvedValue({
      updatedAt: null,
      connectionStatus: null,
    });

    await expect(
      completeMetaOAuthPageSelection({
        attemptId: attempt.id,
        pageId: 'not-in-list',
        userId: 'user-1',
        businessId: 'biz-1',
      }),
    ).rejects.toMatchObject({ code: 'invalid_page_selection' });
  });

  it('T/V. subscription success marks connected with webhook timestamp', async () => {
    const encrypted = encryptMetaOAuthPagesPayload([
      { id: 'p1', name: 'One', access_token: 'page-access' },
    ]);
    const attempt = await createMetaOAuthAttempt({
      userId: 'user-1',
      businessId: 'biz-1',
      metaUserId: 'm',
      pagesPayloadEncrypted: encrypted,
      connectionBaselineAt: null,
    });

    vi.spyOn(connectionService, 'readMetaConnectionBaseline').mockResolvedValue({
      updatedAt: null,
      connectionStatus: null,
    });

    vi.spyOn(connectionService, 'finalizeMetaConnectionWithSubscription').mockResolvedValue({
      connectionId: 'conn-1',
      pageId: 'p1',
      pageName: 'One',
      connectionStatus: 'connected',
      webhookSubscribedAt: '2026-01-01T00:00:00.000Z',
    });

    const result = await completeMetaOAuthPageSelection({
      attemptId: attempt.id,
      pageId: 'p1',
      userId: 'user-1',
      businessId: 'biz-1',
    });

    expect(result.connectionStatus).toBe('connected');
    expect(result.webhookSubscribedAt).toBeTruthy();
    expect(JSON.stringify(result)).not.toMatch(/page-access/);
  });

  it('U. subscription failure does not return connected', async () => {
    const encrypted = encryptMetaOAuthPagesPayload([
      { id: 'p1', name: 'One', access_token: 'page-access' },
    ]);
    const attempt = await createMetaOAuthAttempt({
      userId: 'user-1',
      businessId: 'biz-1',
      metaUserId: 'm',
      pagesPayloadEncrypted: encrypted,
      connectionBaselineAt: null,
    });

    vi.spyOn(connectionService, 'readMetaConnectionBaseline').mockResolvedValue({
      updatedAt: null,
      connectionStatus: null,
    });

    vi.spyOn(connectionService, 'finalizeMetaConnectionWithSubscription').mockResolvedValue({
      connectionId: 'conn-1',
      pageId: 'p1',
      pageName: 'One',
      connectionStatus: 'error',
      lastError: 'subscription failed',
    });

    await expect(
      completeMetaOAuthPageSelection({
        attemptId: attempt.id,
        pageId: 'p1',
        userId: 'user-1',
        businessId: 'biz-1',
      }),
    ).rejects.toMatchObject({ code: 'page_subscription_failed' });
  });

  it('R. encrypted v1 format used in connection finalize (integration)', async () => {
    const chain = {
      eq: vi.fn(() => chain),
      order: vi.fn(() => chain),
      limit: vi.fn(() => chain),
      maybeSingle: async () => ({ data: null }),
    };
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'meta_connections') {
          return {
            select: () => chain,
            insert: (row: Record<string, unknown>) => ({
              select: () => ({
                single: async () => {
                  expect(String(row.access_token_encrypted)).toMatch(/^v1:/);
                  return { data: { id: 'new-conn' }, error: null };
                },
              }),
            }),
            update: () => ({ eq: async () => ({ error: null }) }),
          };
        }
        throw new Error(`unexpected table ${table}`);
      }),
    };

    vi.mocked(getSupabaseAdminOptional).mockReturnValue(mockSupabase as never);
    vi.spyOn(graph, 'subscribeMetaPageToLeadgen').mockResolvedValue(undefined);

    const result = await connectionService.finalizeMetaConnectionWithSubscription({
      userId: 'u',
      businessId: 'b',
      pageId: 'p1',
      pageName: 'P',
      pageAccessToken: 'plain-token',
    });

    expect(result.connectionStatus).toBe('connected');
    expect(result.webhookSubscribedAt).toBeTruthy();
  });

  it('Y. client payload guard rejects token-like fields', () => {
    expect(() =>
      assertNoSecretsInClientPayload({ access_token: 'x' }),
    ).toThrow();
    expect(() =>
      assertNoSecretsInClientPayload({ error: 'failed', message: 'ok' }),
    ).not.toThrow();
  });
});
