import { serverLog } from '../../core/logger.server';
import type { StoredFormConnection, WebhookProcessResult } from './externalForms.types';
import { extractSubmissionId, hashPayload, normalizeWebhookResponse } from './externalForms.mapper';
import { getExternalFormsStore } from './externalForms.store';

export async function registerFormConnection(conn: StoredFormConnection): Promise<void> {
  const store = getExternalFormsStore();
  await store.registerConnection(conn);
}

export async function getPendingSubmissions(businessId: string) {
  return getExternalFormsStore().getPendingSubmissions(businessId);
}

export async function acknowledgeSubmissions(ids: string[]): Promise<void> {
  await getExternalFormsStore().acknowledgeSubmissions(ids);
}

export async function getServerPipelineDebug(businessId: string) {
  const debug = await getExternalFormsStore().getDebugState(businessId);
  return {
    storage: debug.storage,
    pendingCount: debug.pendingCount,
    lastWebhookAt: debug.lastWebhookAt,
    lastWebhookPreview: debug.lastWebhookPreview,
    storageReason: debug.storageReason,
  };
}

export async function processWebhookPayload(
  connectionId: string,
  secret: string | undefined,
  rawPayload: unknown,
  headerSecret?: string,
): Promise<WebhookProcessResult> {
  serverLog('WEBHOOK_RECEIVED', {
    connectionId,
    hasBody: rawPayload != null,
    timestamp: new Date().toISOString(),
  });

  const store = getExternalFormsStore();
  const conn = await store.getConnection(connectionId);

  if (!conn) {
    serverLog('SUBMISSION_FAILED', { stage: 'connection_lookup', connectionId });
    return { ok: false, status: 404, body: { error: 'Connection not found' } };
  }

  if (!conn.isActive) {
    serverLog('SUBMISSION_FAILED', { stage: 'connection_inactive', connectionId });
    return { ok: false, status: 403, body: { error: 'Connection inactive' } };
  }

  const providedSecret = secret ?? headerSecret;
  if (conn.secretKey && providedSecret !== conn.secretKey) {
    serverLog('SUBMISSION_FAILED', { stage: 'invalid_secret', connectionId });
    return { ok: false, status: 401, body: { error: 'Invalid secret key' } };
  }

  const externalSubmissionId = extractSubmissionId(rawPayload);
  const dedupKey = externalSubmissionId ?? hashPayload(connectionId, rawPayload);

  if (await store.isDuplicate(dedupKey, connectionId)) {
    return { ok: true, status: 200, body: { processed: false, duplicate: true } };
  }

  store.markProcessed(dedupKey);

  const submissionId = crypto.randomUUID();
  const entry = {
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

  await store.enqueueSubmission(entry);

  serverLog('SUBMISSION_ENQUEUED', {
    submissionId,
    connectionId,
    businessId: conn.businessId,
    storage: store.getStorageBackend(),
    timestamp: new Date().toISOString(),
  });

  const { fields, unmapped } = normalizeWebhookResponse(
    conn.provider,
    rawPayload,
    conn.fieldMapping,
  );

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

export interface FormsWebhookRequest {
  method?: string;
  body: unknown;
  query: Record<string, string | string[] | undefined>;
  headers: Record<string, string | string[] | undefined>;
  url?: string;
  pathConnectionId?: string;
}

function queryParam(
  query: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const q = query[key];
  if (typeof q === 'string') return q;
  if (Array.isArray(q)) return q[0];
  return undefined;
}

export function resolveFormsWebhookConnectionId(
  req: FormsWebhookRequest,
): string | undefined {
  if (req.pathConnectionId?.trim()) return req.pathConnectionId.trim();

  const fromQuery = queryParam(req.query, 'connectionId');
  if (fromQuery?.trim()) return fromQuery.trim();

  const body = req.body;
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const id = (body as Record<string, unknown>).connectionId;
    if (typeof id === 'string' && id.trim()) return id.trim();
  }
  return undefined;
}

export function resolveFormsWebhookSecret(req: FormsWebhookRequest): string | undefined {
  const fromQuery = queryParam(req.query, 'secret');
  if (fromQuery) return fromQuery;

  const headerSecret = req.headers['x-form-secret'];
  if (typeof headerSecret === 'string') return headerSecret;
  if (Array.isArray(headerSecret)) return headerSecret[0];

  return undefined;
}

export async function handleFormsWebhookRequest(
  req: FormsWebhookRequest,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const connectionId = resolveFormsWebhookConnectionId(req);
  const secret = resolveFormsWebhookSecret(req);

  serverLog('forms-webhook', {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    connectionId: connectionId ?? null,
    hasSecret: Boolean(secret),
  });

  if (req.method !== 'POST') {
    return { status: 405, body: { error: 'Method not allowed' } };
  }

  if (req.body == null || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return { status: 400, body: { error: 'Invalid payload — expected JSON object' } };
  }

  if (!connectionId) {
    return { status: 400, body: { error: 'Missing connectionId' } };
  }

  const headerSecret =
    typeof req.headers['x-form-secret'] === 'string' ? req.headers['x-form-secret'] : undefined;

  const result = await processWebhookPayload(connectionId, secret, req.body, headerSecret);
  return { status: result.status, body: result.body };
}
