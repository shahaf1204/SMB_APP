import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processWebhookPayload } from '../_lib/externalFormsStore';

function querySecret(req: VercelRequest): string | undefined {
  const q = req.query.secret;
  if (typeof q === 'string') return q;
  if (Array.isArray(q)) return q[0];
  return undefined;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const connectionId = String(req.query.connectionId ?? '').trim();
  if (!connectionId) {
    res.status(400).json({ error: 'Missing connectionId' });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
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
