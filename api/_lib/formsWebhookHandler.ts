import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processWebhookPayload } from './externalFormsStore';

function queryParam(req: VercelRequest, key: string): string | undefined {
  const q = req.query[key];
  if (typeof q === 'string') return q;
  if (Array.isArray(q)) return q[0];
  return undefined;
}

export function resolveFormsWebhookConnectionId(
  req: VercelRequest,
  pathConnectionId?: string,
): string | undefined {
  if (pathConnectionId?.trim()) return pathConnectionId.trim();

  const fromQuery = queryParam(req, 'connectionId');
  if (fromQuery?.trim()) return fromQuery.trim();

  const body = req.body;
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const id = (body as Record<string, unknown>).connectionId;
    if (typeof id === 'string' && id.trim()) return id.trim();
  }
  return undefined;
}

export function resolveFormsWebhookSecret(req: VercelRequest): string | undefined {
  const fromQuery = queryParam(req, 'secret');
  if (fromQuery) return fromQuery;

  const headerSecret = req.headers['x-form-secret'];
  if (typeof headerSecret === 'string') return headerSecret;
  if (Array.isArray(headerSecret)) return headerSecret[0];

  return undefined;
}

export function logFormsWebhookRequest(
  req: VercelRequest,
  connectionId: string | undefined,
  secret: string | undefined,
): void {
  console.log('[forms-webhook]', {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    connectionId: connectionId ?? null,
    secret: secret ?? null,
  });
}

export async function handleFormsWebhook(
  req: VercelRequest,
  res: VercelResponse,
  options?: { pathConnectionId?: string },
): Promise<void> {
  const connectionId = resolveFormsWebhookConnectionId(req, options?.pathConnectionId);
  const secret = resolveFormsWebhookSecret(req);

  logFormsWebhookRequest(req, connectionId, secret);

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (req.body == null || typeof req.body !== 'object' || Array.isArray(req.body)) {
    res.status(400).json({ error: 'Invalid payload — expected JSON object' });
    return;
  }

  if (!connectionId) {
    res.status(400).json({ error: 'Missing connectionId' });
    return;
  }

  const headerSecret =
    typeof req.headers['x-form-secret'] === 'string' ? req.headers['x-form-secret'] : undefined;

  const result = processWebhookPayload(connectionId, secret, req.body, headerSecret);

  res.status(result.status).json(result.body);
}
