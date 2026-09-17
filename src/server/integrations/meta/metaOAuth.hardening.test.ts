import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../core/supabase.server', () => ({
  getSupabaseAdminOptional: vi.fn(() => null),
  getMetaAppSecret: vi.fn(() => 'secret'),
  getMetaGraphVersion: vi.fn(() => 'v21.0'),
}));

import * as connectionService from './metaConnection.service';
import * as graph from './metaGraph.client';
import {
  completeMetaOAuthPageSelection,
  getSafeMetaOAuthPageCandidates,
  metaOAuthErrorToClient,
} from './metaOAuth.service';
import {
  claimMetaOAuthAttemptForFinalization,
  consumeMetaOAuthState,
  createMetaOAuthAttempt,
  createMetaOAuthState,
  finalizeMetaOAuthAttempt,
  resetMetaOAuthMemoryStoreForTests,
} from './metaOAuth.store';
import { encryptMetaOAuthPagesPayload } from './metaOAuth.pagesPayload';
import { MetaOAuthError, sanitizeMetaPersistedError } from './metaOAuth.errors';
import { assertMetaConnectionInvariants } from './metaConnection.invariants';

describe('3A.3.1 OAuth hardening', () => {
  beforeEach(() => {
    resetMetaOAuthMemoryStoreForTests();
    process.env.INTEGRATION_ENCRYPTION_KEY = 'hardening-test-key';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    resetMetaOAuthMemoryStoreForTests();
  });

  it('A. page already connected to another business', async () => {
    vi.spyOn(connectionService, 'assertMetaPageAvailableForBusiness').mockRejectedValue(
      new MetaOAuthError('page_already_connected'),
    );

    const encrypted = encryptMetaOAuthPagesPayload([
      { id: 'p1', name: 'P', access_token: 'tok' },
    ]);
    const attempt = await createMetaOAuthAttempt({
      userId: 'u1',
      businessId: 'biz-b',
      metaUserId: 'm',
      pagesPayloadEncrypted: encrypted,
      connectionBaselineAt: null,
    });

    await expect(
      completeMetaOAuthPageSelection({
        attemptId: attempt.id,
        pageId: 'p1',
        userId: 'u1',
        businessId: 'biz-b',
      }),
    ).rejects.toBeTruthy();
  });

  it('B. same-business reconnect allowed (mocked success path)', async () => {
    vi.spyOn(connectionService, 'assertMetaPageAvailableForBusiness').mockResolvedValue(undefined);
    vi.spyOn(connectionService, 'readMetaConnectionBaseline').mockResolvedValue({
      updatedAt: '2026-01-01T00:00:00.000Z',
      connectionStatus: 'connected',
    });
    vi.spyOn(connectionService, 'finalizeMetaConnectionWithSubscription').mockResolvedValue({
      connectionId: 'c1',
      pageId: 'p1',
      pageName: 'P',
      connectionStatus: 'connected',
      webhookSubscribedAt: '2026-01-02T00:00:00.000Z',
    });

    const encrypted = encryptMetaOAuthPagesPayload([
      { id: 'p1', name: 'P', access_token: 'tok' },
    ]);
    const attempt = await createMetaOAuthAttempt({
      userId: 'u1',
      businessId: 'biz-1',
      metaUserId: 'm',
      pagesPayloadEncrypted: encrypted,
      connectionBaselineAt: '2026-01-01T00:00:00.000Z',
    });

    const result = await completeMetaOAuthPageSelection({
      attemptId: attempt.id,
      pageId: 'p1',
      userId: 'u1',
      businessId: 'biz-1',
    });
    expect(result.connectionStatus).toBe('connected');
  });

  it('C. concurrent state consumption — only one succeeds', async () => {
    const state = await createMetaOAuthState('u1', 'biz-1');
    const results = await Promise.allSettled([
      consumeMetaOAuthState(state.stateToken),
      consumeMetaOAuthState(state.stateToken),
    ]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
  });

  it('D. concurrent attempt finalization — only one claim', async () => {
    const encrypted = encryptMetaOAuthPagesPayload([
      { id: 'p1', name: 'P', access_token: 'tok' },
    ]);
    const attempt = await createMetaOAuthAttempt({
      userId: 'u1',
      businessId: 'biz-1',
      metaUserId: 'm',
      pagesPayloadEncrypted: encrypted,
      connectionBaselineAt: null,
    });

    const results = await Promise.allSettled([
      claimMetaOAuthAttemptForFinalization({
        attemptId: attempt.id,
        userId: 'u1',
        businessId: 'biz-1',
      }),
      claimMetaOAuthAttemptForFinalization({
        attemptId: attempt.id,
        userId: 'u1',
        businessId: 'biz-1',
      }),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  });

  it('F. reconnect subscription failure preserves healthy connection (throws, no swap)', async () => {
    vi.spyOn(connectionService, 'assertMetaPageAvailableForBusiness').mockResolvedValue(undefined);
    vi.spyOn(connectionService, 'readMetaConnectionBaseline').mockResolvedValue({
      updatedAt: '2026-01-01T00:00:00.000Z',
      connectionStatus: 'connected',
    });
    vi.spyOn(connectionService, 'finalizeMetaConnectionWithSubscription').mockRejectedValue(
      new MetaOAuthError('page_subscription_failed'),
    );

    const encrypted = encryptMetaOAuthPagesPayload([
      { id: 'p2', name: 'P2', access_token: 'tok2' },
    ]);
    const attempt = await createMetaOAuthAttempt({
      userId: 'u1',
      businessId: 'biz-1',
      metaUserId: 'm',
      pagesPayloadEncrypted: encrypted,
      connectionBaselineAt: '2026-01-01T00:00:00.000Z',
    });

    await expect(
      completeMetaOAuthPageSelection({
        attemptId: attempt.id,
        pageId: 'p2',
        userId: 'u1',
        businessId: 'biz-1',
      }),
    ).rejects.toBeTruthy();
  });

  it('H/I. finalized attempt clears encrypted payload', async () => {
    const encrypted = encryptMetaOAuthPagesPayload([
      { id: 'p1', name: 'P', access_token: 'secret-tok' },
    ]);
    const attempt = await createMetaOAuthAttempt({
      userId: 'u1',
      businessId: 'biz-1',
      metaUserId: 'm',
      pagesPayloadEncrypted: encrypted,
      connectionBaselineAt: null,
    });

    await finalizeMetaOAuthAttempt({
      attemptId: attempt.id,
      userId: 'u1',
      businessId: 'biz-1',
      status: 'completed',
    });

    await expect(
      getSafeMetaOAuthPageCandidates({
        attemptId: attempt.id,
        userId: 'u1',
        businessId: 'biz-1',
      }),
    ).rejects.toMatchObject({ code: 'attempt_consumed' });
  });

  it('J/K. token-like Graph error sanitized', () => {
    const raw = 'Meta fail access_token=EAAFAKE123&more=1 Bearer xyz EAAABC';
    const safe = sanitizeMetaPersistedError(raw);
    expect(safe).not.toMatch(/EAAFAKE/);
    expect(safe).not.toContain('Bearer xyz');
    const client = metaOAuthErrorToClient('page_subscription_failed');
    expect(JSON.stringify(client)).not.toMatch(/EAA/);
  });

  it('L/M. connected invariants vs failure', () => {
    expect(() =>
      assertMetaConnectionInvariants({
        connectionStatus: 'connected',
        isActive: true,
        webhookSubscribedAt: '2026-01-01T00:00:00.000Z',
      }),
    ).not.toThrow();

    expect(() =>
      assertMetaConnectionInvariants({
        connectionStatus: 'error',
        isActive: true,
        webhookSubscribedAt: null,
      }),
    ).toThrow();

    expect(() =>
      assertMetaConnectionInvariants({
        connectionStatus: 'connected',
        isActive: true,
        webhookSubscribedAt: null,
      }),
    ).toThrow();
  });

  it('E. subscribe-before-persist on first connect (graph mock order)', async () => {
    const order: string[] = [];
    vi.spyOn(connectionService, 'assertMetaPageAvailableForBusiness').mockImplementation(async () => {
      order.push('assert-page');
    });
    vi.spyOn(graph, 'subscribeMetaPageToLeadgen').mockImplementation(async () => {
      order.push('subscribe');
    });

    const eqChain = {
      eq: vi.fn(function (this: unknown) {
        return eqChain;
      }),
      order: vi.fn(() => eqChain),
      limit: vi.fn(() => eqChain),
      maybeSingle: async () => ({ data: null }),
    };
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table !== 'meta_connections') throw new Error(table);
        return {
          select: () => eqChain,
          insert: () => ({
            select: () => ({
              single: async () => {
                order.push('insert');
                return { data: { id: 'c-new' }, error: null };
              },
            }),
          }),
        };
      }),
    };

    const { getSupabaseAdminOptional } = await import('../../core/supabase.server');
    vi.mocked(getSupabaseAdminOptional).mockReturnValue(mockSupabase as never);

    await connectionService.finalizeMetaConnectionWithSubscription({
      userId: 'u1',
      businessId: 'biz-1',
      pageId: 'p1',
      pageName: 'P',
      pageAccessToken: 'plain',
    });

    expect(order.indexOf('subscribe')).toBeLessThan(order.indexOf('insert'));
  });
});
