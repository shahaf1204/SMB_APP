import { encryptIntegrationSecret } from '../../core/integrationSecrets.server';
import { getSupabaseAdminOptional } from '../../core/supabase.server';
import { MetaOAuthError, sanitizeMetaPersistedError } from './metaOAuth.errors';
import { subscribeMetaPageToLeadgen } from './metaGraph.client';
import { assertMetaConnectionInvariants } from './metaConnection.invariants';

export interface MetaConnectionBaseline {
  updatedAt: string | null;
  connectionStatus: string | null;
}

export interface ExistingBusinessMetaConnection {
  id: string;
  pageId: string;
  connectionStatus: string;
  isActive: boolean;
  webhookSubscribedAt: string | null;
  accessTokenEncrypted: string | null;
  pageName: string;
}

export async function readMetaConnectionBaseline(
  userId: string,
  businessId: string,
): Promise<MetaConnectionBaseline> {
  const supabase = getSupabaseAdminOptional();
  if (!supabase) return { updatedAt: null, connectionStatus: null };

  const { data } = await supabase
    .from('meta_connections')
    .select('updated_at, connection_status')
    .eq('user_id', userId)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    updatedAt: (data?.updated_at as string | null) ?? null,
    connectionStatus: (data?.connection_status as string | null) ?? null,
  };
}

export function assertAttemptNotStaleForConnection(
  attemptBaselineAt: string | null,
  connectionUpdatedAt: string | null,
  connectionStatus: string | null,
): void {
  if (!connectionUpdatedAt || !attemptBaselineAt) return;
  if (connectionStatus !== 'connected') return;

  const baselineMs = Date.parse(attemptBaselineAt);
  const connectionMs = Date.parse(connectionUpdatedAt);
  if (
    !Number.isNaN(baselineMs) &&
    !Number.isNaN(connectionMs) &&
    connectionMs > baselineMs
  ) {
    throw new MetaOAuthError('stale_attempt');
  }
}

/**
 * A Meta Page may belong to only one business while actively connected.
 * Same-business reconnect to the same Page is allowed.
 */
export async function assertMetaPageAvailableForBusiness(
  pageId: string,
  businessId: string,
): Promise<void> {
  const supabase = getSupabaseAdminOptional();
  if (!supabase) {
    throw new MetaOAuthError('configuration_error');
  }

  const { data } = await supabase
    .from('meta_connections')
    .select('business_id, connection_status, is_active')
    .eq('page_id', pageId.trim())
    .eq('is_active', true)
    .eq('connection_status', 'connected')
    .maybeSingle();

  if (!data) return;

  if ((data.business_id as string) !== businessId) {
    throw new MetaOAuthError('page_already_connected');
  }
}

async function loadExistingBusinessConnection(
  userId: string,
  businessId: string,
): Promise<ExistingBusinessMetaConnection | null> {
  const supabase = getSupabaseAdminOptional();
  if (!supabase) return null;

  const { data } = await supabase
    .from('meta_connections')
    .select(
      'id, page_id, page_name, connection_status, is_active, webhook_subscribed_at, access_token_encrypted',
    )
    .eq('user_id', userId)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id as string,
    pageId: data.page_id as string,
    pageName: data.page_name as string,
    connectionStatus: data.connection_status as string,
    isActive: Boolean(data.is_active),
    webhookSubscribedAt: (data.webhook_subscribed_at as string | null) ?? null,
    accessTokenEncrypted: (data.access_token_encrypted as string | null) ?? null,
  };
}

export interface FinalizeMetaConnectionInput {
  userId: string;
  businessId: string;
  pageId: string;
  pageName: string;
  pageAccessToken: string;
}

export interface FinalizeMetaConnectionResult {
  connectionId: string;
  pageId: string;
  pageName: string;
  connectionStatus: 'connected' | 'error' | 'reconnect_required';
  webhookSubscribedAt?: string;
  lastError?: string;
}

/**
 * Reconnect-safe order:
 * 1) page ownership 2) subscribe with new token (no credential write yet)
 * 3) on success persist connected row 4) on failure preserve prior healthy connection
 */
export async function finalizeMetaConnectionWithSubscription(
  input: FinalizeMetaConnectionInput,
): Promise<FinalizeMetaConnectionResult> {
  const supabase = getSupabaseAdminOptional();
  if (!supabase) {
    throw new MetaOAuthError('configuration_error');
  }

  await assertMetaPageAvailableForBusiness(input.pageId, input.businessId);

  const existing = await loadExistingBusinessConnection(input.userId, input.businessId);
  const hadHealthyConnection =
    existing?.isActive === true && existing.connectionStatus === 'connected';

  try {
    await subscribeMetaPageToLeadgen(input.pageId, input.pageAccessToken);
  } catch (e) {
    const message = sanitizeMetaPersistedError(e instanceof Error ? e.message : String(e));

    if (hadHealthyConnection && existing) {
      throw new MetaOAuthError('page_subscription_failed', message);
    }

    const now = new Date().toISOString();
    if (existing) {
      await supabase
        .from('meta_connections')
        .update({
          connection_status: 'error',
          is_active: false,
          last_error: message,
          updated_at: now,
        })
        .eq('id', existing.id);
      return {
        connectionId: existing.id,
        pageId: existing.pageId,
        pageName: existing.pageName,
        connectionStatus: 'error',
        lastError: message,
      };
    }

    throw new MetaOAuthError('page_subscription_failed', message);
  }

  const now = new Date().toISOString();
  const encryptedToken = encryptIntegrationSecret(input.pageAccessToken);
  let connectionId: string;

  if (existing) {
    connectionId = existing.id;
    const { error } = await supabase
      .from('meta_connections')
      .update({
        page_id: input.pageId,
        page_name: input.pageName,
        access_token_encrypted: encryptedToken,
        connection_status: 'connected',
        is_active: true,
        webhook_subscribed_at: now,
        last_error: null,
        updated_at: now,
      })
      .eq('id', connectionId);
    if (error) {
      throw new MetaOAuthError('authorization_failed', sanitizeMetaPersistedError(error.message));
    }
  } else {
    const { data: inserted, error } = await supabase
      .from('meta_connections')
      .insert({
        user_id: input.userId,
        business_id: input.businessId,
        page_id: input.pageId,
        page_name: input.pageName,
        access_token_encrypted: encryptedToken,
        connection_status: 'connected',
        is_active: true,
        webhook_subscribed_at: now,
        updated_at: now,
      })
      .select('id')
      .single();
    if (error || !inserted) {
      throw new MetaOAuthError('authorization_failed', sanitizeMetaPersistedError(error?.message ?? ''));
    }
    connectionId = inserted.id as string;
  }

  assertMetaConnectionInvariants({
    connectionStatus: 'connected',
    isActive: true,
    webhookSubscribedAt: now,
  });

  return {
    connectionId,
    pageId: input.pageId,
    pageName: input.pageName,
    connectionStatus: 'connected',
    webhookSubscribedAt: now,
  };
}
