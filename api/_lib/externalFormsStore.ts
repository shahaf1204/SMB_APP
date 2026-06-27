import type { ExternalFormConnection } from '../../src/types/externalForms';

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

export function registerFormConnection(conn: StoredFormConnection): void {
  connections.set(conn.id, conn);
}

export function getFormConnection(connectionId: string): StoredFormConnection | undefined {
  return connections.get(connectionId);
}

export function isDuplicateSubmission(dedupKey: string): boolean {
  return processedDedup.has(dedupKey);
}

export function markSubmissionProcessed(dedupKey: string): void {
  processedDedup.add(dedupKey);
}

export function enqueueSubmission(entry: QueuedFormSubmission): void {
  queue.push(entry);
}

export function getPendingSubmissions(businessId: string): QueuedFormSubmission[] {
  return queue.filter((q) => q.businessId === businessId && !q.acknowledged);
}

export function acknowledgeSubmissions(ids: string[]): void {
  for (const item of queue) {
    if (ids.includes(item.id)) item.acknowledged = true;
  }
}

export function processWebhookPayload(
  connectionId: string,
  secret: string | undefined,
  rawPayload: unknown,
  headerSecret?: string,
): {
  ok: boolean;
  status: number;
  body: Record<string, unknown>;
} {
  const conn = connections.get(connectionId);
  if (!conn) {
    return { ok: false, status: 404, body: { error: 'Connection not found' } };
  }

  if (!conn.isActive) {
    return { ok: false, status: 403, body: { error: 'Connection inactive' } };
  }

  const providedSecret = secret ?? headerSecret;
  if (conn.secretKey && providedSecret !== conn.secretKey) {
    return { ok: false, status: 401, body: { error: 'Invalid secret key' } };
  }

  const externalSubmissionId = extractSubmissionId(rawPayload);
  const dedupKey = externalSubmissionId ?? hashPayload(connectionId, rawPayload);

  if (isDuplicateSubmission(dedupKey)) {
    return { ok: true, status: 200, body: { processed: false, duplicate: true } };
  }

  markSubmissionProcessed(dedupKey);

  const submissionId = crypto.randomUUID();
  enqueueSubmission({
    id: submissionId,
    connectionId,
    businessId: conn.businessId,
    provider: conn.provider,
    externalSubmissionId,
    dedupKey,
    rawPayload,
    receivedAt: new Date().toISOString(),
    acknowledged: false,
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
