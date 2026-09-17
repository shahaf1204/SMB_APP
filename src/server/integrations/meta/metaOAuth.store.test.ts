import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../core/supabase.server', () => ({
  getSupabaseAdminOptional: vi.fn(() => null),
}));

import { encryptIntegrationSecret } from '../../core/integrationSecrets.server';
import { MetaOAuthError } from './metaOAuth.errors';
import {
  consumeMetaOAuthState,
  createMetaOAuthAttempt,
  createMetaOAuthState,
  expireMetaOAuthStateForTests,
  getMetaOAuthAttemptById,
  loadMetaOAuthAttemptForUser,
  resetMetaOAuthMemoryStoreForTests,
} from './metaOAuth.store';

describe('meta OAuth state', () => {
  beforeEach(() => {
    resetMetaOAuthMemoryStoreForTests();
    process.env.INTEGRATION_ENCRYPTION_KEY = 'oauth-state-test-key';
  });

  afterEach(() => {
    resetMetaOAuthMemoryStoreForTests();
  });

  it('A/B. start generates state bound to user/business', async () => {
    const state = await createMetaOAuthState('user-1', 'biz-1');
    expect(state.stateToken.length).toBeGreaterThan(20);
    expect(state.userId).toBe('user-1');
    expect(state.businessId).toBe('biz-1');
  });

  it('C. missing state rejected', async () => {
    await expect(consumeMetaOAuthState('')).rejects.toBeInstanceOf(MetaOAuthError);
  });

  it('D. invalid state rejected', async () => {
    await expect(consumeMetaOAuthState('not-real')).rejects.toMatchObject({ code: 'invalid_state' });
  });

  it('E. expired state rejected', async () => {
    const state = await createMetaOAuthState('user-1', 'biz-1');
    expireMetaOAuthStateForTests(state.stateToken);
    await expect(consumeMetaOAuthState(state.stateToken)).rejects.toMatchObject({
      code: 'state_expired',
    });
  });

  it('F. consumed state rejected', async () => {
    const state = await createMetaOAuthState('user-1', 'biz-1');
    await consumeMetaOAuthState(state.stateToken);
    await expect(consumeMetaOAuthState(state.stateToken)).rejects.toMatchObject({
      code: 'state_consumed',
    });
  });
});

describe('meta OAuth attempt ownership', () => {
  beforeEach(() => {
    resetMetaOAuthMemoryStoreForTests();
    process.env.INTEGRATION_ENCRYPTION_KEY = 'oauth-state-test-key';
  });

  it('N/W. attempt access denied for other business', async () => {
    const attempt = await createMetaOAuthAttempt({
      userId: 'user-1',
      businessId: 'biz-1',
      metaUserId: 'meta-1',
      pagesPayloadEncrypted: encryptIntegrationSecret('{}'),
      connectionBaselineAt: null,
    });

    await expect(
      loadMetaOAuthAttemptForUser({
        attemptId: attempt.id,
        userId: 'user-1',
        businessId: 'biz-other',
      }),
    ).rejects.toMatchObject({ code: 'attempt_access_denied' });
  });
});

describe('meta OAuth attempt persistence', () => {
  beforeEach(() => {
    resetMetaOAuthMemoryStoreForTests();
    process.env.INTEGRATION_ENCRYPTION_KEY = 'oauth-state-test-key';
  });

  it('creates attempt with opaque id', async () => {
    const attempt = await createMetaOAuthAttempt({
      userId: 'u',
      businessId: 'b',
      metaUserId: 'm',
      pagesPayloadEncrypted: encryptIntegrationSecret('{"pages":[]}'),
      connectionBaselineAt: null,
    });
    const loaded = await getMetaOAuthAttemptById(attempt.id);
    expect(loaded?.id).toBe(attempt.id);
  });
});
