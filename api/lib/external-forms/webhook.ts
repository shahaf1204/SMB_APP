import type { VercelRequest } from '@vercel/node';
import { directCreateFromFormsWebhook } from './directCreate';

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

/** Direct webhook: parse → create client + activity in app_snapshots. No queue, no polling. */
export async function processFormsWebhook(req: VercelRequest): Promise<FormsWebhookResult> {
  console.log('[FORMS_WEBHOOK_RECEIVED]', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
  });

  if (req.method !== 'POST') {
    return { status: 405, body: { ok: false, error: 'Method not allowed' } };
  }

  if (req.body == null || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return { status: 200, body: { ok: false, error: 'Invalid payload — expected JSON object' } };
  }

  const connectionId = resolveConnectionId(req);
  if (!connectionId) {
    return { status: 200, body: { ok: false, error: 'Missing connectionId' } };
  }

  try {
    return await directCreateFromFormsWebhook({
      connectionId,
      secret: resolveSecret(req),
      rawPayload: req.body,
    });
  } catch (e) {
    console.error('[FORMS_PARSE_ERROR]', {
      connectionId,
      error: e instanceof Error ? e.message : String(e),
    });
    return {
      status: 200,
      body: {
        ok: false,
        error: e instanceof Error ? e.message : 'Webhook processing failed',
      },
    };
  }
}
