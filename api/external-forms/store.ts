import type { SupabaseClient } from '@supabase/supabase-js';

type ExternalFormProviderId =
  | 'forms_app'
  | 'google_forms'
  | 'typeform'
  | 'jotform'
  | 'tally'
  | 'custom';

type ExternalFormActivityType = 'event' | 'card' | 'program' | 'course';

interface ExternalFormFieldMapping {
  externalField: string;
  appField: string;
}

export interface StoredFormConnection {
  id: string;
  businessId: string;
  ownerId: string;
  provider: ExternalFormProviderId;
  formName: string;
  formUrl?: string;
  secretKey: string;
  activityType: ExternalFormActivityType;
  isActive: boolean;
  fieldMapping: ExternalFormFieldMapping[];
}

export interface QueuedFormSubmission {
  id: string;
  connectionId: string;
  businessId: string;
  provider: ExternalFormProviderId;
  externalSubmissionId?: string;
  dedupKey: string;
  rawPayload: unknown;
  receivedAt: string;
  acknowledged: boolean;
}

export interface ExternalFormsDebugMeta {
  storage: 'supabase' | 'memory';
  storageReason: string;
  pendingCount: number;
  lastWebhookAt: string | null;
  lastWebhookPreview: string | null;
}

let supabaseClient: SupabaseClient | null | undefined;
let supabaseInitError: string | null = null;

const memoryConnections = new Map<string, StoredFormConnection>();
const memoryQueue: QueuedFormSubmission[] = [];

function getServerSupabaseEnv(): { url: string; key: string } | null {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return { url, key };
}

async function getSupabaseClientOptional(): Promise<SupabaseClient | null> {
  if (supabaseClient !== undefined) return supabaseClient;

  const env = getServerSupabaseEnv();
  if (!env) {
    supabaseClient = null;
    return null;
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    supabaseClient = createClient(env.url, env.key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    supabaseInitError = null;
    return supabaseClient;
  } catch (e) {
    supabaseInitError = e instanceof Error ? e.message : String(e);
    supabaseClient = null;
    return null;
  }
}

function deriveMemoryFallbackReason(): string {
  if (!process.env.SUPABASE_URL?.trim()) {
    return 'memory — SUPABASE_URL missing in server process.env';
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return 'memory — SUPABASE_SERVICE_ROLE_KEY missing in server process.env';
  }
  if (supabaseInitError) {
    return `memory — Supabase client init failed: ${supabaseInitError}`;
  }
  return 'memory — Supabase client unavailable';
}

export async function getStorageBackend(): Promise<'supabase' | 'memory'> {
  const client = await getSupabaseClientOptional();
  return client ? 'supabase' : 'memory';
}

export async function getStorageReason(): Promise<string> {
  const client = await getSupabaseClientOptional();
  if (client) {
    return 'supabase — SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY configured';
  }
  return deriveMemoryFallbackReason();
}

export async function registerFormConnection(conn: StoredFormConnection): Promise<void> {
  memoryConnections.set(conn.id, conn);

  const sb = await getSupabaseClientOptional();
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

  if (error) console.error('[external-forms] registerConnection', error.message);
}

function getPendingSubmissionsMemory(businessId: string): QueuedFormSubmission[] {
  return memoryQueue.filter((q) => q.businessId === businessId && !q.acknowledged);
}

async function getPendingSubmissionsSupabase(
  sb: SupabaseClient,
  businessId: string,
): Promise<QueuedFormSubmission[]> {
  const { data, error } = await sb
    .from('external_form_submissions')
    .select(
      'id, connection_id, business_id, provider, external_submission_id, dedupe_hash, raw_payload, created_at',
    )
    .eq('business_id', businessId)
    .eq('status', 'received')
    .order('created_at', { ascending: true })
    .limit(50);

  if (error || !data) {
    console.error('[external-forms] getPendingSubmissions', error?.message);
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

export async function getPendingSubmissions(businessId: string): Promise<QueuedFormSubmission[]> {
  const memoryPending = getPendingSubmissionsMemory(businessId);
  const sb = await getSupabaseClientOptional();
  if (!sb) return memoryPending;

  const persisted = await getPendingSubmissionsSupabase(sb, businessId);
  const byId = new Map<string, QueuedFormSubmission>();
  for (const item of [...persisted, ...memoryPending]) {
    if (!item.acknowledged) byId.set(item.id, item);
  }
  return [...byId.values()];
}

export async function acknowledgeSubmissions(ids: string[]): Promise<void> {
  for (const item of memoryQueue) {
    if (ids.includes(item.id)) item.acknowledged = true;
  }

  const sb = await getSupabaseClientOptional();
  if (!sb || ids.length === 0) return;

  const { error } = await sb
    .from('external_form_submissions')
    .update({
      status: 'mapped',
      updated_at: new Date().toISOString(),
    })
    .in('id', ids);

  if (error) console.error('[external-forms] acknowledgeSubmissions', error.message);
}

export async function getServerPipelineDebug(businessId: string): Promise<ExternalFormsDebugMeta> {
  const storage = await getStorageBackend();
  const storageReason = await getStorageReason();
  const sb = await getSupabaseClientOptional();

  if (sb) {
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
      storage,
      storageReason,
      pendingCount: count ?? 0,
      lastWebhookAt: lastRow?.created_at ?? null,
      lastWebhookPreview: preview,
    };
  }

  const memoryPending = getPendingSubmissionsMemory(businessId);
  const last = memoryPending[memoryPending.length - 1];

  return {
    storage,
    storageReason,
    pendingCount: memoryPending.length,
    lastWebhookAt: last?.receivedAt ?? null,
    lastWebhookPreview: last ? JSON.stringify(last.rawPayload).slice(0, 400) : null,
  };
}
