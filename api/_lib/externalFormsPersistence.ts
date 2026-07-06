import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { QueuedFormSubmission, StoredFormConnection } from './externalFormsStore';

let admin: SupabaseClient | null | undefined;

export function isExternalFormsPersistenceEnabled(): boolean {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url && key);
}

function getAdminOptional(): SupabaseClient | null {
  if (admin !== undefined) return admin;
  if (!isExternalFormsPersistenceEnabled()) {
    admin = null;
    return null;
  }
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}

export async function persistRegisterConnection(conn: StoredFormConnection): Promise<void> {
  const sb = getAdminOptional();
  if (!sb) return;

  const { error } = await sb.from('external_form_connections').upsert({
    id: conn.id,
    business_id: conn.businessId,
    owner_id: conn.ownerId,
    provider: conn.provider,
    form_name: conn.formName,
    form_url: conn.formUrl ?? null,
    webhook_url: '',
    secret_key: conn.secretKey,
    activity_type: conn.activityType,
    is_active: conn.isActive,
    field_mapping: conn.fieldMapping,
    updated_at: new Date().toISOString(),
  });

  if (error) console.error('[SUBMISSION_FAILED] persistRegisterConnection', error.message);
}

export async function persistLoadConnection(
  connectionId: string,
): Promise<StoredFormConnection | null> {
  const sb = getAdminOptional();
  if (!sb) return null;

  const { data, error } = await sb
    .from('external_form_connections')
    .select('*')
    .eq('id', connectionId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    businessId: data.business_id,
    ownerId: data.owner_id,
    provider: data.provider,
    formName: data.form_name,
    formUrl: data.form_url ?? undefined,
    secretKey: data.secret_key,
    activityType: data.activity_type,
    isActive: data.is_active,
    fieldMapping: data.field_mapping ?? [],
  };
}

export async function persistEnqueueSubmission(entry: QueuedFormSubmission): Promise<void> {
  const sb = getAdminOptional();
  if (!sb) return;

  const { error } = await sb.from('external_form_submissions').insert({
    id: entry.id,
    business_id: entry.businessId,
    connection_id: entry.connectionId,
    provider: entry.provider,
    external_submission_id: entry.externalSubmissionId ?? null,
    dedupe_hash: entry.dedupKey,
    raw_payload: entry.rawPayload,
    status: 'received',
  });

  if (error) {
    if (error.code === '23505') return;
    console.error('[SUBMISSION_FAILED] persistEnqueueSubmission', error.message);
  }
}

export async function persistGetPendingSubmissions(
  businessId: string,
): Promise<QueuedFormSubmission[]> {
  const sb = getAdminOptional();
  if (!sb) return [];

  const { data, error } = await sb
    .from('external_form_submissions')
    .select('id, connection_id, business_id, provider, external_submission_id, dedupe_hash, raw_payload, created_at')
    .eq('business_id', businessId)
    .eq('status', 'received')
    .order('created_at', { ascending: true })
    .limit(50);

  if (error || !data) {
    console.error('[SUBMISSION_FAILED] persistGetPendingSubmissions', error?.message);
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    connectionId: row.connection_id,
    businessId: row.business_id,
    provider: row.provider,
    externalSubmissionId: row.external_submission_id ?? undefined,
    dedupKey: row.dedupe_hash ?? row.id,
    rawPayload: row.raw_payload,
    receivedAt: row.created_at,
    acknowledged: false,
  }));
}

export async function persistAcknowledgeSubmissions(
  ids: string[],
  patch?: { status: 'created' | 'failed'; errorMessage?: string; createdActivityId?: string },
): Promise<void> {
  const sb = getAdminOptional();
  if (!sb || ids.length === 0) return;

  const { error } = await sb
    .from('external_form_submissions')
    .update({
      status: patch?.status ?? 'mapped',
      error_message: patch?.errorMessage ?? null,
      created_activity_id: patch?.createdActivityId ?? null,
      updated_at: new Date().toISOString(),
    })
    .in('id', ids);

  if (error) console.error('[SUBMISSION_FAILED] persistAcknowledgeSubmissions', error.message);
}

export async function persistIsDuplicate(dedupKey: string, connectionId: string): Promise<boolean> {
  const sb = getAdminOptional();
  if (!sb) return false;

  const { data } = await sb
    .from('external_form_submissions')
    .select('id')
    .eq('connection_id', connectionId)
    .eq('dedupe_hash', dedupKey)
    .in('status', ['received', 'mapped', 'created'])
    .limit(1);

  return (data?.length ?? 0) > 0;
}

export interface ServerPipelineDebug {
  storage: 'supabase' | 'memory';
  pendingCount: number;
  lastWebhookAt: string | null;
  lastWebhookPreview: string | null;
}

export async function persistGetServerDebug(businessId: string): Promise<ServerPipelineDebug> {
  const sb = getAdminOptional();
  if (!sb) {
    return { storage: 'memory', pendingCount: 0, lastWebhookAt: null, lastWebhookPreview: null };
  }

  const { count } = await sb
    .from('external_form_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .eq('status', 'received');

  const { data: lastRow } = await sb
    .from('external_form_submissions')
    .select('created_at, raw_payload')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let preview: string | null = null;
  if (lastRow?.raw_payload) {
    try {
      preview = JSON.stringify(lastRow.raw_payload).slice(0, 400);
    } catch {
      preview = String(lastRow.raw_payload).slice(0, 400);
    }
  }

  return {
    storage: 'supabase',
    pendingCount: count ?? 0,
    lastWebhookAt: lastRow?.created_at ?? null,
    lastWebhookPreview: preview,
  };
}
