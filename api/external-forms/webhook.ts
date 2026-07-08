import type { VercelRequest } from '@vercel/node';
import {
  applyFieldMapping,
  extractFormsAppSubmissionId,
  hashPayload,
  parseFormsAppPayload,
} from './formsAppParser';
import {
  getFormConnection,
  enqueueSubmission,
  isDuplicateSubmission,
  markSubmissionProcessed,
  type StoredFormConnection,
} from './store';

function queryParam(
  query: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const q = query[key];
  if (typeof q === 'string') return q;
  if (Array.isArray(q)) return q[0];
  return undefined;
}

function resolveConnectionId(req: VercelRequest): string | undefined {
  const fromQuery = queryParam(req.query as Record<string, string | string[] | undefined>, 'connectionId');
  if (fromQuery?.trim()) return fromQuery.trim();

  const body = req.body;
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const id = (body as Record<string, unknown>).connectionId;
    if (typeof id === 'string' && id.trim()) return id.trim();
  }
  return undefined;
}

function resolveSecret(req: VercelRequest): string | undefined {
  const fromQuery = queryParam(req.query as Record<string, string | string[] | undefined>, 'secret');
  if (fromQuery) return fromQuery;

  const headerSecret = req.headers['x-form-secret'];
  if (typeof headerSecret === 'string') return headerSecret;
  if (Array.isArray(headerSecret)) return headerSecret[0];
  return undefined;
}

export interface FormsWebhookResult {
  status: number;
  body: Record<string, unknown>;
}

export async function processFormsWebhook(req: VercelRequest): Promise<FormsWebhookResult> {
  console.log('[FORMS_WEBHOOK_RECEIVED]', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
  });

  if (req.method !== 'POST') {
    return { status: 405, body: { processed: false, error: 'Method not allowed' } };
  }

  if (req.body == null || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return { status: 400, body: { processed: false, error: 'Invalid payload — expected JSON object' } };
  }

  const connectionId = resolveConnectionId(req);
  if (!connectionId) {
    return { status: 400, body: { processed: false, error: 'Missing connectionId' } };
  }

  const secret = resolveSecret(req);
  const headerSecret =
    typeof req.headers['x-form-secret'] === 'string' ? req.headers['x-form-secret'] : undefined;

  let conn: StoredFormConnection | undefined;
  try {
    conn = await getFormConnection(connectionId);
  } catch (e) {
    console.error('[FORMS_PARSE_ERROR]', { stage: 'connection_lookup', error: e });
    return {
      status: 200,
      body: {
        processed: false,
        error: e instanceof Error ? e.message : 'Connection lookup failed',
      },
    };
  }

  if (!conn) {
    return { status: 404, body: { processed: false, error: 'Connection not found' } };
  }

  if (!conn.isActive) {
    return { status: 403, body: { processed: false, error: 'Connection inactive' } };
  }

  const providedSecret = secret ?? headerSecret;
  if (conn.secretKey && providedSecret !== conn.secretKey) {
    return { status: 401, body: { processed: false, error: 'Invalid secret key' } };
  }

  const rawPayload = req.body;
  let parsedFields: Record<string, string> = {};
  let mappedFields: Record<string, string> = {};
  let unmappedFields: Record<string, string> = {};

  try {
    parsedFields = parseFormsAppPayload(rawPayload);
    const mapped = applyFieldMapping(parsedFields, conn.fieldMapping);
    mappedFields = mapped.fields;
    unmappedFields = mapped.unmapped;

    console.log('[FORMS_PAYLOAD_PARSED]', {
      connectionId,
      fieldCount: Object.keys(parsedFields).length,
      mappedCount: Object.keys(mappedFields).length,
      labels: Object.keys(parsedFields),
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[FORMS_PARSE_ERROR]', {
      connectionId,
      error: e instanceof Error ? e.message : String(e),
    });
    return {
      status: 200,
      body: {
        processed: false,
        error: e instanceof Error ? e.message : 'Payload parse failed',
        parseStage: 'FORMS_PAYLOAD_PARSED',
      },
    };
  }

  const externalSubmissionId = extractFormsAppSubmissionId(rawPayload);
  const dedupKey = externalSubmissionId ?? hashPayload(connectionId, rawPayload);

  try {
    if (await isDuplicateSubmission(dedupKey, connectionId)) {
      return { status: 200, body: { processed: false, duplicate: true } };
    }

    markSubmissionProcessed(dedupKey);

    const submissionId = crypto.randomUUID();
    await enqueueSubmission({
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

    console.log('[FORMS_SUBMISSION_STORED]', {
      submissionId,
      connectionId,
      businessId: conn.businessId,
      externalSubmissionId: externalSubmissionId ?? null,
      timestamp: new Date().toISOString(),
    });

    return {
      status: 200,
      body: {
        processed: true,
        duplicate: false,
        submissionId,
        normalized: {
          externalSubmissionId,
          fields: mappedFields,
          unmapped: unmappedFields,
          parsedFields,
          sourceProvider: conn.provider,
        },
      },
    };
  } catch (e) {
    console.error('[FORMS_PARSE_ERROR]', {
      stage: 'store',
      connectionId,
      error: e instanceof Error ? e.message : String(e),
    });
    return {
      status: 200,
      body: {
        processed: false,
        error: e instanceof Error ? e.message : 'Failed to store submission',
        parseStage: 'FORMS_SUBMISSION_STORED',
        normalized: {
          externalSubmissionId,
          fields: mappedFields,
          unmapped: unmappedFields,
          parsedFields,
        },
      },
    };
  }
}
