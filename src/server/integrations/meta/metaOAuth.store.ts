import { randomBytes } from 'crypto';
import { getSupabaseAdminOptional } from '../../core/supabase.server';
import {
  META_OAUTH_ATTEMPT_TTL_MS,
  META_OAUTH_STATE_TTL_MS,
} from './metaOAuth.constants';
import { MetaOAuthError, sanitizeMetaPersistedError } from './metaOAuth.errors';

export interface MetaOAuthStateRecord {
  id: string;
  stateToken: string;
  userId: string;
  businessId: string;
  createdAt: string;
  expiresAt: string;
  consumedAt: string | null;
}

export type MetaOAuthAttemptStatus = 'pending' | 'completed' | 'expired' | 'failed';

export interface MetaOAuthAttemptRecord {
  id: string;
  userId: string;
  businessId: string;
  metaUserId: string | null;
  pagesPayloadEncrypted: string;
  status: MetaOAuthAttemptStatus;
  connectionBaselineAt: string | null;
  lastError: string | null;
  createdAt: string;
  expiresAt: string;
  consumedAt: string | null;
}

const memoryStates = new Map<string, MetaOAuthStateRecord>();
const memoryAttempts = new Map<string, MetaOAuthAttemptRecord>();

function useMemoryStore(): boolean {
  return getSupabaseAdminOptional() === null;
}

export function resetMetaOAuthMemoryStoreForTests(): void {
  memoryStates.clear();
  memoryAttempts.clear();
}

function generateStateToken(): string {
  return randomBytes(32).toString('base64url');
}

export async function createMetaOAuthState(
  userId: string,
  businessId: string,
): Promise<MetaOAuthStateRecord> {
  const now = Date.now();
  const record: MetaOAuthStateRecord = {
    id: crypto.randomUUID(),
    stateToken: generateStateToken(),
    userId,
    businessId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + META_OAUTH_STATE_TTL_MS).toISOString(),
    consumedAt: null,
  };

  if (useMemoryStore()) {
    memoryStates.set(record.stateToken, record);
    return record;
  }

  const supabase = getSupabaseAdminOptional()!;
  const { data, error } = await supabase
    .from('meta_oauth_states')
    .insert({
      state_token: record.stateToken,
      user_id: userId,
      business_id: businessId,
      expires_at: record.expiresAt,
    })
    .select('*')
    .single();

  if (error || !data) throw error ?? new Error('OAuth state insert failed');
  return mapStateRow(data);
}

function mapStateRow(row: Record<string, unknown>): MetaOAuthStateRecord {
  return {
    id: row.id as string,
    stateToken: row.state_token as string,
    userId: row.user_id as string,
    businessId: row.business_id as string,
    createdAt: row.created_at as string,
    expiresAt: row.expires_at as string,
    consumedAt: (row.consumed_at as string | null) ?? null,
  };
}

export async function consumeMetaOAuthState(stateToken: string): Promise<MetaOAuthStateRecord> {
  const trimmed = stateToken.trim();
  if (!trimmed) {
    throw new MetaOAuthError('invalid_state');
  }

  const consumedAt = new Date().toISOString();

  if (useMemoryStore()) {
    const record = memoryStates.get(trimmed);
    if (!record) throw new MetaOAuthError('invalid_state');
    validateStateRecord(record);
    if (record.consumedAt) {
      throw new MetaOAuthError('state_consumed');
    }
    const claimed = { ...record, consumedAt };
    memoryStates.set(trimmed, claimed);
    return claimed;
  }

  const supabase = getSupabaseAdminOptional()!;
  const nowIso = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from('meta_oauth_states')
    .update({ consumed_at: consumedAt })
    .eq('state_token', trimmed)
    .is('consumed_at', null)
    .gt('expires_at', nowIso)
    .select('*')
    .maybeSingle();

  if (updateError || !updated) {
    throw new MetaOAuthError('state_consumed');
  }

  return mapStateRow(updated as Record<string, unknown>);
}

function validateStateRecord(record: MetaOAuthStateRecord): void {
  if (record.consumedAt) {
    throw new MetaOAuthError('state_consumed');
  }
  if (Date.parse(record.expiresAt) <= Date.now()) {
    throw new MetaOAuthError('state_expired');
  }
}

export async function createMetaOAuthAttempt(input: {
  userId: string;
  businessId: string;
  metaUserId: string;
  pagesPayloadEncrypted: string;
  connectionBaselineAt: string | null;
}): Promise<MetaOAuthAttemptRecord> {
  const now = Date.now();
  const record: MetaOAuthAttemptRecord = {
    id: crypto.randomUUID(),
    userId: input.userId,
    businessId: input.businessId,
    metaUserId: input.metaUserId,
    pagesPayloadEncrypted: input.pagesPayloadEncrypted,
    status: 'pending',
    connectionBaselineAt: input.connectionBaselineAt,
    lastError: null,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + META_OAUTH_ATTEMPT_TTL_MS).toISOString(),
    consumedAt: null,
  };

  if (useMemoryStore()) {
    memoryAttempts.set(record.id, record);
    return record;
  }

  const supabase = getSupabaseAdminOptional()!;
  const { data, error } = await supabase
    .from('meta_oauth_attempts')
    .insert({
      user_id: record.userId,
      business_id: record.businessId,
      meta_user_id: record.metaUserId,
      pages_payload_encrypted: record.pagesPayloadEncrypted,
      connection_baseline_at: record.connectionBaselineAt,
      expires_at: record.expiresAt,
    })
    .select('*')
    .single();

  if (error || !data) throw error ?? new Error('OAuth attempt insert failed');
  return mapAttemptRow(data as Record<string, unknown>);
}

function mapAttemptRow(row: Record<string, unknown>): MetaOAuthAttemptRecord {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    businessId: row.business_id as string,
    metaUserId: (row.meta_user_id as string | null) ?? null,
    pagesPayloadEncrypted: row.pages_payload_encrypted as string,
    status: row.status as MetaOAuthAttemptStatus,
    connectionBaselineAt: (row.connection_baseline_at as string | null) ?? null,
    lastError: (row.last_error as string | null) ?? null,
    createdAt: row.created_at as string,
    expiresAt: row.expires_at as string,
    consumedAt: (row.consumed_at as string | null) ?? null,
  };
}

export async function getMetaOAuthAttemptById(id: string): Promise<MetaOAuthAttemptRecord | null> {
  if (useMemoryStore()) {
    return memoryAttempts.get(id) ?? null;
  }

  const supabase = getSupabaseAdminOptional()!;
  const { data } = await supabase.from('meta_oauth_attempts').select('*').eq('id', id).maybeSingle();
  return data ? mapAttemptRow(data as Record<string, unknown>) : null;
}

function validateAttemptAccess(
  record: MetaOAuthAttemptRecord,
  userId: string,
  businessId: string,
): void {
  if (record.userId !== userId || record.businessId !== businessId) {
    throw new MetaOAuthError('attempt_access_denied');
  }
  if (record.consumedAt) {
    throw new MetaOAuthError('attempt_consumed');
  }
  if (Date.parse(record.expiresAt) <= Date.now()) {
    throw new MetaOAuthError('attempt_expired');
  }
  if (record.status !== 'pending') {
    throw new MetaOAuthError('attempt_consumed');
  }
}

export async function loadMetaOAuthAttemptForUser(input: {
  attemptId: string;
  userId: string;
  businessId: string;
}): Promise<MetaOAuthAttemptRecord> {
  const record = await getMetaOAuthAttemptById(input.attemptId);
  if (!record) throw new MetaOAuthError('attempt_not_found');
  validateAttemptAccess(record, input.userId, input.businessId);
  return record;
}

/** Atomically claim attempt for Page selection — prevents double finalization. */
export async function claimMetaOAuthAttemptForFinalization(input: {
  attemptId: string;
  userId: string;
  businessId: string;
}): Promise<MetaOAuthAttemptRecord> {
  if (useMemoryStore()) {
    const record = memoryAttempts.get(input.attemptId);
    if (!record) throw new MetaOAuthError('attempt_not_found');
    validateAttemptAccess(record, input.userId, input.businessId);
    if (record.consumedAt) {
      throw new MetaOAuthError('attempt_consumed');
    }
    const claimed = { ...record, consumedAt: new Date().toISOString() };
    memoryAttempts.set(record.id, claimed);
    return claimed;
  }

  const supabase = getSupabaseAdminOptional()!;
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('meta_oauth_attempts')
    .update({ consumed_at: nowIso })
    .eq('id', input.attemptId)
    .eq('user_id', input.userId)
    .eq('business_id', input.businessId)
    .eq('status', 'pending')
    .is('consumed_at', null)
    .gt('expires_at', nowIso)
    .select('*')
    .maybeSingle();

  if (error || !data) {
    throw new MetaOAuthError('attempt_consumed');
  }

  const record = mapAttemptRow(data as Record<string, unknown>);
  if (Date.parse(record.expiresAt) <= Date.now()) {
    throw new MetaOAuthError('attempt_expired');
  }
  return record;
}

const CLEARED_PAGES_PAYLOAD = '';

export async function finalizeMetaOAuthAttempt(input: {
  attemptId: string;
  userId: string;
  businessId: string;
  status: 'completed' | 'failed';
  lastError?: string | null;
}): Promise<void> {
  const consumedAt = new Date().toISOString();

  if (useMemoryStore()) {
    const record = memoryAttempts.get(input.attemptId);
    if (!record) return;
    memoryAttempts.set(record.id, {
      ...record,
      status: input.status,
      consumedAt: record.consumedAt ?? consumedAt,
      pagesPayloadEncrypted: CLEARED_PAGES_PAYLOAD,
      lastError: input.lastError ?? record.lastError,
    });
    return;
  }

  const supabase = getSupabaseAdminOptional()!;
  await supabase
    .from('meta_oauth_attempts')
    .update({
      status: input.status,
      consumed_at: consumedAt,
      last_error: input.lastError ? sanitizeMetaPersistedError(input.lastError) : null,
      pages_payload_encrypted: CLEARED_PAGES_PAYLOAD,
    })
    .eq('id', input.attemptId)
    .eq('user_id', input.userId)
    .eq('business_id', input.businessId);
}


/** Test-only: backdate attempt expiration. */
export function expireMetaOAuthAttemptForTests(attemptId: string): void {
  if (!useMemoryStore()) throw new Error('memory store only');
  const record = memoryAttempts.get(attemptId);
  if (!record) throw new Error('attempt not found');
  memoryAttempts.set(attemptId, {
    ...record,
    expiresAt: new Date(Date.now() - 60_000).toISOString(),
  });
}

/** Test-only: backdate state expiration. */
export function expireMetaOAuthStateForTests(stateToken: string): void {
  if (!useMemoryStore()) throw new Error('memory store only');
  const record = memoryStates.get(stateToken);
  if (!record) throw new Error('state not found');
  memoryStates.set(stateToken, {
    ...record,
    expiresAt: new Date(Date.now() - 60_000).toISOString(),
  });
}
