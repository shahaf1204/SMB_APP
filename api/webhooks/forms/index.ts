import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processWebhookPayload } from '../../_lib/externalFormsStore';

function queryParam(req: VercelRequest, key: string): string | undefined {
  const q = req.query[key];
  if (typeof q === 'string') return q;
  if (Array.isArray(q)) return q[0];
  return undefined;
}

function querySecret(req: VercelRequest): string | undefined {
  return queryParam(req, 'secret');
}

function resolveConnectionId(req: VercelRequest): string {
  const fromQuery = queryParam(req, 'connectionId');
  if (fromQuery?.trim()) return fromQuery.trim();

  const body = req.body;
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const id = (body as Record<string, unknown>).connectionId;
    if (typeof id === 'string' && id.trim()) return id.trim();
  }
  return '';
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (req.body == null || typeof req.body !== 'object' || Array.isArray(req.body)) {
    res.status(400).json({ error: 'Invalid payload — expected JSON object' });
    return;
  }

  const connectionId = resolveConnectionId(req);
  if (!connectionId) {
    res.status(400).json({ error: 'Missing connectionId' });
    return;
  }

  const headerSecret =
    typeof req.headers['x-form-secret'] === 'string' ? req.headers['x-form-secret'] : undefined;

  const result = processWebhookPayload(
    connectionId,
    querySecret(req),
    req.body,
    headerSecret,
  );

  res.status(result.status).json(result.body);
}
