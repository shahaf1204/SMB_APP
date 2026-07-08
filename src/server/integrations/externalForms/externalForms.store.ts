import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdminOptional, isSupabaseConfigured } from '../../core/supabase.server';
import { serverError, serverLog } from '../../core/logger.server';
import type {
  ExternalFormsDebugState,
  QueuedFormSubmission,
  StoredFormConnection,
} from './externalForms.types';

export interface ExternalFormsStore {
  registerConnection(connection: StoredFormConnection): Promise<void>;
  getConnection(connectionId: string): Promise<StoredFormConnection | undefined>;
  enqueueSubmission(submission: QueuedFormSubmission): Promise<void>;
  getPendingSubmissions(businessId: string): Promise<QueuedFormSubmission[]>;
  acknowledgeSubmissions(ids: string[]): Promise<void>;
  isDuplicate(dedupKey: string, connectionId: string): Promise<boolean>;
  getDebugState(businessId: string): Promise<ExternalFormsDebugState>;
  getStorageBackend(): 'supabase' | 'memory';
  getStorageReason(): string;
}

export class MemoryExternalFormsStore implements ExternalFormsStore {
  private connections = new Map<string, StoredFormConnection>();
  private queue: QueuedFormSubmission[] = [];
  private processedDedup = new Set<string>();

  async registerConnection(connection: StoredFormConnection): Promise<void> {
    this.connections.set(connection.id, connection);
  }

  async getConnection(connectionId: string): Promise<StoredFormConnection | undefined> {
    return this.connections.get(connectionId);
  }

  cacheConnection(connection: StoredFormConnection): void {
    this.connections.set(connection.id, connection);
  }

  async enqueueSubmission(submission: QueuedFormSubmission): Promise<void> {
    this.queue.push(submission);
  }

  async getPendingSubmissions(businessId: string): Promise<QueuedFormSubmission[]> {
    return this.queue.filter((q) => q.businessId === businessId && !q.acknowledged);
  }

  async acknowledgeSubmissions(ids: string[]): Promise<void> {
    for (const item of this.queue) {
      if (ids.includes(item.id)) item.acknowledged = true;
    }
  }

  async isDuplicate(dedupKey: string, _connectionId: string): Promise<boolean> {
    return this.processedDedup.has(dedupKey);
  }

  markProcessed(dedupKey: string): void {
    this.processedDedup.add(dedupKey);
  }

  async getDebugState(businessId: string): Promise<ExternalFormsDebugState> {
    const pending = await this.getPendingSubmissions(businessId);
    const last = pending[pending.length - 1];
    return {
      storage: 'memory',
      storageReason: 'memory-only store',
      pendingCount: pending.length,
      lastWebhookAt: last?.receivedAt ?? null,
      lastWebhookPreview: last ? JSON.stringify(last.rawPayload).slice(0, 400) : null,
    };
  }

  getStorageBackend(): 'supabase' | 'memory' {
    return 'memory';
  }

  getStorageReason(): string {
    return 'memory-only store';
  }
}

export class SupabaseExternalFormsStore implements ExternalFormsStore {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async registerConnection(conn: StoredFormConnection): Promise<void> {
    const { error } = await this.client.from('external_form_connections').upsert({
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
    if (error) serverError('SUBMISSION_FAILED', { stage: 'persistRegisterConnection', message: error.message });
  }

  async getConnection(connectionId: string): Promise<StoredFormConnection | undefined> {
    const { data, error } = await this.client
      .from('external_form_connections')
      .select('*')
      .eq('id', connectionId)
      .maybeSingle();

    if (error || !data) return undefined;

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

  async enqueueSubmission(entry: QueuedFormSubmission): Promise<void> {
    const { error } = await this.client.from('external_form_submissions').insert({
      id: entry.id,
      business_id: entry.businessId,
      connection_id: entry.connectionId,
      provider: entry.provider,
      external_submission_id: entry.externalSubmissionId ?? null,
      dedupe_hash: entry.dedupKey,
      raw_payload: entry.rawPayload,
      status: 'received',
    });

    if (error && error.code !== '23505') {
      serverError('SUBMISSION_FAILED', { stage: 'persistEnqueueSubmission', message: error.message });
    }
  }

  async getPendingSubmissions(businessId: string): Promise<QueuedFormSubmission[]> {
    const { data, error } = await this.client
      .from('external_form_submissions')
      .select(
        'id, connection_id, business_id, provider, external_submission_id, dedupe_hash, raw_payload, created_at',
      )
      .eq('business_id', businessId)
      .eq('status', 'received')
      .order('created_at', { ascending: true })
      .limit(50);

    if (error || !data) {
      serverError('SUBMISSION_FAILED', { stage: 'persistGetPendingSubmissions', message: error?.message });
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

  async acknowledgeSubmissions(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const { error } = await this.client
      .from('external_form_submissions')
      .update({
        status: 'mapped',
        updated_at: new Date().toISOString(),
      })
      .in('id', ids);

    if (error) serverError('SUBMISSION_FAILED', { stage: 'persistAcknowledgeSubmissions', message: error.message });
  }

  async isDuplicate(dedupKey: string, connectionId: string): Promise<boolean> {
    const { data } = await this.client
      .from('external_form_submissions')
      .select('id')
      .eq('connection_id', connectionId)
      .eq('dedupe_hash', dedupKey)
      .in('status', ['received', 'mapped', 'created'])
      .limit(1);

    return (data?.length ?? 0) > 0;
  }

  async getDebugState(businessId: string): Promise<ExternalFormsDebugState> {
    const { count } = await this.client
      .from('external_form_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('status', 'received');

    const { data: lastRow } = await this.client
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
      storageReason: 'supabase — env valid and client initialized',
      pendingCount: count ?? 0,
      lastWebhookAt: lastRow?.created_at ?? null,
      lastWebhookPreview: preview,
    };
  }

  getStorageBackend(): 'supabase' | 'memory' {
    return 'supabase';
  }

  getStorageReason(): string {
    return 'supabase — env valid and client initialized';
  }
}

class CompositeExternalFormsStore implements ExternalFormsStore {
  private memory = new MemoryExternalFormsStore();
  private supabase: SupabaseExternalFormsStore | null;
  private storageReason: string;

  constructor() {
    const client = getSupabaseAdminOptional();
    if (client) {
      this.supabase = new SupabaseExternalFormsStore(client);
      this.storageReason = 'supabase — SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY configured';
      serverLog('external-forms-store', { backend: 'supabase' });
    } else {
      this.supabase = null;
      this.storageReason = deriveMemoryFallbackReason();
      serverLog('external-forms-store', { backend: 'memory', reason: this.storageReason });
    }
  }

  async registerConnection(connection: StoredFormConnection): Promise<void> {
    await this.memory.registerConnection(connection);
    await this.supabase?.registerConnection(connection);
  }

  async getConnection(connectionId: string): Promise<StoredFormConnection | undefined> {
    const cached = await this.memory.getConnection(connectionId);
    if (cached) return cached;

    const loaded = await this.supabase?.getConnection(connectionId);
    if (loaded) {
      this.memory.cacheConnection(loaded);
      return loaded;
    }
    return undefined;
  }

  async enqueueSubmission(submission: QueuedFormSubmission): Promise<void> {
    await this.memory.enqueueSubmission(submission);
    await this.supabase?.enqueueSubmission(submission);
  }

  async getPendingSubmissions(businessId: string): Promise<QueuedFormSubmission[]> {
    const memoryPending = await this.memory.getPendingSubmissions(businessId);
    if (!this.supabase) return memoryPending;

    const persisted = await this.supabase.getPendingSubmissions(businessId);
    const byId = new Map<string, QueuedFormSubmission>();
    for (const item of [...persisted, ...memoryPending]) {
      if (!item.acknowledged) byId.set(item.id, item);
    }
    return [...byId.values()];
  }

  async acknowledgeSubmissions(ids: string[]): Promise<void> {
    await this.memory.acknowledgeSubmissions(ids);
    await this.supabase?.acknowledgeSubmissions(ids);
  }

  async isDuplicate(dedupKey: string, connectionId: string): Promise<boolean> {
    if (await this.memory.isDuplicate(dedupKey, connectionId)) return true;
    if (this.supabase) return this.supabase.isDuplicate(dedupKey, connectionId);
    return false;
  }

  markProcessed(dedupKey: string): void {
    this.memory.markProcessed(dedupKey);
  }

  async getDebugState(businessId: string): Promise<ExternalFormsDebugState> {
    if (this.supabase) {
      const debug = await this.supabase.getDebugState(businessId);
      return { ...debug, storageReason: this.storageReason };
    }
    const debug = await this.memory.getDebugState(businessId);
    return { ...debug, storageReason: this.storageReason };
  }

  getStorageBackend(): 'supabase' | 'memory' {
    return this.supabase ? 'supabase' : 'memory';
  }

  getStorageReason(): string {
    return this.storageReason;
  }
}

function deriveMemoryFallbackReason(): string {
  if (!process.env.SUPABASE_URL?.trim()) {
    return 'memory — SUPABASE_URL missing in server process.env (check Vercel env + redeploy)';
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return 'memory — SUPABASE_SERVICE_ROLE_KEY missing in server process.env';
  }
  if (!isSupabaseConfigured()) {
    return 'memory — Supabase env vars present but client initialization failed';
  }
  return 'memory — Supabase client unavailable';
}

let storeInstance: CompositeExternalFormsStore | undefined;

export function getExternalFormsStore(): CompositeExternalFormsStore {
  if (!storeInstance) storeInstance = new CompositeExternalFormsStore();
  return storeInstance;
}
