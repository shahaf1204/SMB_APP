import {
  isExternalFormsPersistenceEnabled,
  persistAcknowledgeSubmissions,
  persistEnqueueSubmission,
  persistGetPendingSubmissions,
  persistGetServerDebug,
  persistIsDuplicate,
  persistLoadConnection,
  persistRegisterConnection,
  type ServerPipelineDebug,
} from './externalFormsPersistence';

type ExternalFormProviderId =
  | 'forms_app'
  | 'google_forms'
  | 'typeform'
  | 'jotform'
  | 'tally'
  | 'custom';

type ExternalFormActivityType = 'event' | 'card' | 'program' | 'course';

type ExternalFormAppField =
  | 'clientName'
  | 'clientPhone'
  | 'clientEmail'
  | 'activityTitle'
  | 'activityDate'
  | 'activityTime'
  | 'location'
  | 'amount'
  | 'notes'
  | 'participantsCount'
  | 'childName'
  | 'childAge'
  | 'packageName'
  | 'source';

interface ExternalFormFieldMapping {
  externalField: string;
  appField: ExternalFormAppField;
}

interface ExternalFormConnection {
  provider: ExternalFormProviderId;
  activityType: ExternalFormActivityType;
  fieldMapping: ExternalFormFieldMapping[];
}

export interface StoredFormConnection {
  id: string;
  businessId: string;
  ownerId: string;
  provider: ExternalFormConnection['provider'];
  formName: string;
  formUrl?: string;
  secretKey: string;
  activityType: ExternalFormConnection['activityType'];
  isActive: boolean;
  fieldMapping: ExternalFormConnection['fieldMapping'];
}

export interface QueuedFormSubmission {
  id: string;
  connectionId: string;
  businessId: string;
  provider: ExternalFormConnection['provider'];
  externalSubmissionId?: string;
  dedupKey: string;
  rawPayload: unknown;
  receivedAt: string;
  acknowledged: boolean;
}

const connections = new Map<string, StoredFormConnection>();
const queue: QueuedFormSubmission[] = [];
const processedDedup = new Set<string>();

function flattenPayload(payload: unknown, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  if (payload == null) return out;
  if (typeof payload !== 'object') {
    if (prefix) out[prefix] = String(payload);
    return out;
  }
  if (Array.isArray(payload)) {
    payload.forEach((item, i) => {
      Object.assign(out, flattenPayload(item, prefix ? `${prefix}[${i}]` : String(i)));
    });
    return out;
  }
  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value != null && typeof value === 'object') {
      Object.assign(out, flattenPayload(value, path));
    } else if (value != null) {
      out[path] = String(value);
    }
  }
  return out;
}

function extractFields(payload: unknown): Record<string, string> {
  if (!payload || typeof payload !== 'object') return flattenPayload(payload);
  const p = payload as Record<string, unknown>;
  if (p.data && typeof p.data === 'object') return flattenPayload(p.data);
  if (p.fields && typeof p.fields === 'object') return flattenPayload(p.fields);
  return flattenPayload(payload);
}

function extractSubmissionId(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const p = payload as Record<string, unknown>;
  for (const key of ['submission_id', 'submissionId', 'id', 'response_id']) {
    const v = p[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

export function hashPayload(connectionId: string, rawPayload: unknown): string {
  const text = JSON.stringify(rawPayload ?? {});
  let hash = 0;
  const key = connectionId + text;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return `hash_${connectionId}_${Math.abs(hash)}`;
}

export async function registerFormConnectionAsync(conn: StoredFormConnection): Promise<void> {
  connections.set(conn.id, conn);
  await persistRegisterConnection(conn);
}

export async function getFormConnectionAsync(
  connectionId: string,
): Promise<StoredFormConnection | undefined> {
  const cached = connections.get(connectionId);
  if (cached) return cached;

  const loaded = await persistLoadConnection(connectionId);
  if (loaded) {
    connections.set(connectionId, loaded);
    return loaded;
  }
  return undefined;
}

function isDuplicateSubmissionMemory(dedupKey: string): boolean {
  return processedDedup.has(dedupKey);
}

function markSubmissionProcessedMemory(dedupKey: string): void {
  processedDedup.add(dedupKey);
}

function enqueueSubmissionMemory(entry: QueuedFormSubmission): void {
  queue.push(entry);
}

function getPendingSubmissionsMemory(businessId: string): QueuedFormSubmission[] {
  return queue.filter((q) => q.businessId === businessId && !q.acknowledged);
}

function acknowledgeSubmissionsMemory(ids: string[]): void {
  for (const item of queue) {
    if (ids.includes(item.id)) item.acknowledged = true;
  }
}

export async function getPendingSubmissionsAsync(
  businessId: string,
): Promise<QueuedFormSubmission[]> {
  const memory = getPendingSubmissionsMemory(businessId);
  if (!isExternalFormsPersistenceEnabled()) return memory;

  const persisted = await persistGetPendingSubmissions(businessId);
  const byId = new Map<string, QueuedFormSubmission>();
  for (const item of [...persisted, ...memory]) {
    if (!item.acknowledged) byId.set(item.id, item);
  }
  return [...byId.values()];
}

export async function acknowledgeSubmissionsAsync(ids: string[]): Promise<void> {
  acknowledgeSubmissionsMemory(ids);
  await persistAcknowledgeSubmissions(ids);
}

export async function getServerPipelineDebug(businessId: string): Promise<ServerPipelineDebug> {
  const debug = await persistGetServerDebug(businessId);
  if (!isExternalFormsPersistenceEnabled()) {
    const memoryPending = getPendingSubmissionsMemory(businessId);
    return {
      storage: 'memory',
      pendingCount: memoryPending.length,
      lastWebhookAt: memoryPending[memoryPending.length - 1]?.receivedAt ?? null,
      lastWebhookPreview: memoryPending[memoryPending.length - 1]
        ? JSON.stringify(memoryPending[memoryPending.length - 1].rawPayload).slice(0, 400)
        : null,
    };
  }
  return debug;
}

export async function processWebhookPayloadAsync(
  connectionId: string,
  secret: string | undefined,
  rawPayload: unknown,
  headerSecret?: string,
): Promise<{
  ok: boolean;
  status: number;
  body: Record<string, unknown>;
}> {
  console.log('[WEBHOOK_RECEIVED]', {
    connectionId,
    hasBody: rawPayload != null,
    timestamp: new Date().toISOString(),
  });

  const conn = await getFormConnectionAsync(connectionId);
  if (!conn) {
    console.log('[SUBMISSION_FAILED]', { stage: 'connection_lookup', connectionId });
    return { ok: false, status: 404, body: { error: 'Connection not found' } };
  }

  if (!conn.isActive) {
    console.log('[SUBMISSION_FAILED]', { stage: 'connection_inactive', connectionId });
    return { ok: false, status: 403, body: { error: 'Connection inactive' } };
  }

  const providedSecret = secret ?? headerSecret;
  if (conn.secretKey && providedSecret !== conn.secretKey) {
    console.log('[SUBMISSION_FAILED]', { stage: 'invalid_secret', connectionId });
    return { ok: false, status: 401, body: { error: 'Invalid secret key' } };
  }

  const externalSubmissionId = extractSubmissionId(rawPayload);
  const dedupKey = externalSubmissionId ?? hashPayload(connectionId, rawPayload);

  if (isDuplicateSubmissionMemory(dedupKey)) {
    return { ok: true, status: 200, body: { processed: false, duplicate: true } };
  }

  if (isExternalFormsPersistenceEnabled()) {
    const dupDb = await persistIsDuplicate(dedupKey, connectionId);
    if (dupDb) {
      return { ok: true, status: 200, body: { processed: false, duplicate: true } };
    }
  }

  markSubmissionProcessedMemory(dedupKey);

  const submissionId = crypto.randomUUID();
  const entry: QueuedFormSubmission = {
    id: submissionId,
    connectionId,
    businessId: conn.businessId,
    provider: conn.provider,
    externalSubmissionId,
    dedupKey,
    rawPayload,
    receivedAt: new Date().toISOString(),
    acknowledged: false,
  };

  enqueueSubmissionMemory(entry);
  await persistEnqueueSubmission(entry);

  console.log('[SUBMISSION_ENQUEUED]', {
    submissionId,
    connectionId,
    businessId: conn.businessId,
    storage: isExternalFormsPersistenceEnabled() ? 'supabase+memory' : 'memory-only',
    timestamp: new Date().toISOString(),
  });

  const rawFields = extractFields(rawPayload);
  const fields: Record<string, string> = {};
  const unmapped: Record<string, string> = {};
  const mapped = new Set<string>();
  for (const { externalField, appField } of conn.fieldMapping) {
    const val = rawFields[externalField]?.trim();
    if (val) {
      fields[appField] = val;
      mapped.add(externalField);
    }
  }
  for (const [k, v] of Object.entries(rawFields)) {
    if (!mapped.has(k) && v.trim()) unmapped[k] = v.trim();
  }

  return {
    ok: true,
    status: 200,
    body: {
      processed: true,
      duplicate: false,
      submissionId,
      normalized: {
        externalSubmissionId,
        fields,
        unmapped,
        sourceProvider: conn.provider,
      },
    },
  };
}

export function registerFormConnection(conn: StoredFormConnection): void {
  connections.set(conn.id, conn);
  void persistRegisterConnection(conn);
}

export function getFormConnection(connectionId: string): StoredFormConnection | undefined {
  return connections.get(connectionId);
}

export function getPendingSubmissions(businessId: string): QueuedFormSubmission[] {
  return getPendingSubmissionsMemory(businessId);
}

export function acknowledgeSubmissions(ids: string[]): void {
  acknowledgeSubmissionsMemory(ids);
  void persistAcknowledgeSubmissions(ids);
}
