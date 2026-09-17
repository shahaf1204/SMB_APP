import { deploymentUrlFromEnv } from '../../core/env.server';
import {
  getMetaOAuthRedirectUri,
} from '../../core/meta.config.server';
import {
  buildMetaOAuthAuthorizationUrl,
  exchangeMetaLongLivedUserToken,
  exchangeMetaOAuthCode,
  fetchMetaManagedPages,
  fetchMetaUserId,
} from './metaGraph.client';
import { MetaOAuthError, safeMetaOAuthUserMessage, sanitizeMetaPersistedError } from './metaOAuth.errors';
import {
  META_OAUTH_FRONTEND_RETURN_PATH,
} from './metaOAuth.constants';
import {
  claimMetaOAuthAttemptForFinalization,
  createMetaOAuthAttempt,
  createMetaOAuthState,
  consumeMetaOAuthState,
  finalizeMetaOAuthAttempt,
  loadMetaOAuthAttemptForUser,
} from './metaOAuth.store';
import {
  decryptMetaOAuthPagesPayload,
  encryptMetaOAuthPagesPayload,
  resolvePageAccessToken,
  toSafeMetaPageCandidates,
} from './metaOAuth.pagesPayload';
import {
  assertAttemptNotStaleForConnection,
  finalizeMetaConnectionWithSubscription,
  readMetaConnectionBaseline,
} from './metaConnection.service';

export function buildMetaOAuthFrontendRedirect(query: Record<string, string>): string {
  const base = deploymentUrlFromEnv() || '';
  const path = META_OAUTH_FRONTEND_RETURN_PATH;
  const url = new URL(`${base.replace(/\/$/, '')}${path}`);
  for (const [k, v] of Object.entries(query)) {
    url.searchParams.set(k, v);
  }
  return url.toString();
}

export async function startMetaOAuthAuthorization(input: {
  userId: string;
  businessId: string;
}): Promise<{ authorizationUrl: string }> {
  const state = await createMetaOAuthState(input.userId, input.businessId);
  const redirectUri = getMetaOAuthRedirectUri();
  const authorizationUrl = buildMetaOAuthAuthorizationUrl({
    redirectUri,
    state: state.stateToken,
  });
  return { authorizationUrl };
}

export async function handleMetaOAuthCallback(query: {
  code?: string;
  state?: string;
  error?: string;
  error_reason?: string;
}): Promise<{ redirectUrl: string }> {
  if (query.error || query.error_reason === 'user_denied') {
    return {
      redirectUrl: buildMetaOAuthFrontendRedirect({
        meta_oauth_error: 'user_cancelled',
      }),
    };
  }

  const code = query.code?.trim();
  const state = query.state?.trim();
  if (!code || !state) {
    return {
      redirectUrl: buildMetaOAuthFrontendRedirect({
        meta_oauth_error: 'authorization_failed',
      }),
    };
  }

  try {
    const stateRecord = await consumeMetaOAuthState(state);
    const redirectUri = getMetaOAuthRedirectUri();

    const shortLived = await exchangeMetaOAuthCode(code, redirectUri);
    const longLived = await exchangeMetaLongLivedUserToken(shortLived.access_token);
    const metaUserId = await fetchMetaUserId(longLived.access_token);
    const pages = await fetchMetaManagedPages(longLived.access_token);

    if (pages.length === 0) {
      return {
        redirectUrl: buildMetaOAuthFrontendRedirect({
          meta_oauth_error: 'no_pages_available',
        }),
      };
    }

    const baseline = await readMetaConnectionBaseline(stateRecord.userId, stateRecord.businessId);
    const attempt = await createMetaOAuthAttempt({
      userId: stateRecord.userId,
      businessId: stateRecord.businessId,
      metaUserId,
      pagesPayloadEncrypted: encryptMetaOAuthPagesPayload(pages),
      connectionBaselineAt: baseline.updatedAt,
    });

    return {
      redirectUrl: buildMetaOAuthFrontendRedirect({
        meta_attempt: attempt.id,
      }),
    };
  } catch (e) {
    if (e instanceof MetaOAuthError) {
      return {
        redirectUrl: buildMetaOAuthFrontendRedirect({ meta_oauth_error: e.code }),
      };
    }
    const code =
      e instanceof Error && /exchange/i.test(e.message)
        ? 'oauth_exchange_failed'
        : e instanceof Error && /discovery/i.test(e.message)
          ? 'page_discovery_failed'
          : 'authorization_failed';
    return {
      redirectUrl: buildMetaOAuthFrontendRedirect({ meta_oauth_error: code }),
    };
  }
}

export async function getSafeMetaOAuthPageCandidates(input: {
  attemptId: string;
  userId: string;
  businessId: string;
}): Promise<{ attemptId: string; pages: Array<{ pageId: string; pageName: string }> }> {
  const attempt = await loadMetaOAuthAttemptForUser(input);
  if (!attempt.pagesPayloadEncrypted.trim()) {
    throw new MetaOAuthError('attempt_consumed');
  }
  const payload = decryptMetaOAuthPagesPayload(attempt.pagesPayloadEncrypted);
  return {
    attemptId: attempt.id,
    pages: toSafeMetaPageCandidates(payload),
  };
}

export async function completeMetaOAuthPageSelection(input: {
  attemptId: string;
  pageId: string;
  userId: string;
  businessId: string;
}): Promise<{
  connectionId: string;
  pageId: string;
  pageName: string;
  connectionStatus: string;
  webhookSubscribedAt?: string;
}> {
  const attempt = await claimMetaOAuthAttemptForFinalization({
    attemptId: input.attemptId,
    userId: input.userId,
    businessId: input.businessId,
  });

  let attemptFinalized = false;

  try {
    const baseline = await readMetaConnectionBaseline(input.userId, input.businessId);
    assertAttemptNotStaleForConnection(
      attempt.connectionBaselineAt,
      baseline.updatedAt,
      baseline.connectionStatus,
    );

    if (!attempt.pagesPayloadEncrypted.trim()) {
      throw new MetaOAuthError('attempt_consumed');
    }

    const payload = decryptMetaOAuthPagesPayload(attempt.pagesPayloadEncrypted);
    const resolved = resolvePageAccessToken(payload, input.pageId.trim());
    if (!resolved) {
      throw new MetaOAuthError('invalid_page_selection');
    }

    const result = await finalizeMetaConnectionWithSubscription({
      userId: input.userId,
      businessId: input.businessId,
      pageId: input.pageId.trim(),
      pageName: resolved.pageName,
      pageAccessToken: resolved.accessToken,
    });

    if (result.connectionStatus !== 'connected') {
      await finalizeMetaOAuthAttempt({
        attemptId: attempt.id,
        userId: input.userId,
        businessId: input.businessId,
        status: 'failed',
        lastError: result.lastError ?? 'page_subscription_failed',
      });
      attemptFinalized = true;
      throw new MetaOAuthError('page_subscription_failed', result.lastError);
    }

    await finalizeMetaOAuthAttempt({
      attemptId: attempt.id,
      userId: input.userId,
      businessId: input.businessId,
      status: 'completed',
    });
    attemptFinalized = true;

    return {
      connectionId: result.connectionId,
      pageId: result.pageId,
      pageName: result.pageName,
      connectionStatus: result.connectionStatus,
      webhookSubscribedAt: result.webhookSubscribedAt,
    };
  } catch (e) {
    if (!attemptFinalized) {
      await finalizeMetaOAuthAttempt({
        attemptId: attempt.id,
        userId: input.userId,
        businessId: input.businessId,
        status: 'failed',
        lastError: sanitizeMetaPersistedError(e instanceof Error ? e.message : String(e)),
      });
    }
    throw e;
  }
}

const META_OAUTH_ERROR_CODES = new Set<MetaOAuthError['code']>([
  'user_cancelled',
  'invalid_state',
  'state_expired',
  'state_consumed',
  'state_user_mismatch',
  'oauth_exchange_failed',
  'page_discovery_failed',
  'no_pages_available',
  'invalid_page_selection',
  'page_subscription_failed',
  'authorization_failed',
  'attempt_expired',
  'attempt_consumed',
  'attempt_not_found',
  'attempt_access_denied',
  'stale_attempt',
  'configuration_error',
  'page_already_connected',
]);

export function metaOAuthErrorToClient(code: string): { error: string; message: string } {
  const key = META_OAUTH_ERROR_CODES.has(code as MetaOAuthError['code'])
    ? (code as MetaOAuthError['code'])
    : 'authorization_failed';
  return { error: code, message: safeMetaOAuthUserMessage(key) };
}

export function assertNoSecretsInClientPayload(payload: unknown): void {
  const raw = JSON.stringify(payload);
  if (/access_token|app_secret|pages_payload_encrypted/i.test(raw)) {
    throw new Error('Client payload must not include token material');
  }
}

export { sanitizeMetaPersistedError };
