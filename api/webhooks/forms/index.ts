import type { VercelRequest, VercelResponse } from '@vercel/node';

/** TEMPORARY — debug logging only. Remove after verifying Forms.app webhooks. */

function queryParam(req: VercelRequest, key: string): string | undefined {
  const q = req.query[key];
  if (typeof q === 'string') return q;
  if (Array.isArray(q)) return q[0];
  return undefined;
}

function resolveConnectionId(req: VercelRequest): string | undefined {
  const fromQuery = queryParam(req, 'connectionId');
  if (fromQuery?.trim()) return fromQuery.trim();

  const body = req.body;
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const id = (body as Record<string, unknown>).connectionId;
    if (typeof id === 'string' && id.trim()) return id.trim();
  }
  return undefined;
}

function resolveSecret(req: VercelRequest): string | undefined {
  const fromQuery = queryParam(req, 'secret');
  if (fromQuery) return fromQuery;

  const headerSecret = req.headers['x-form-secret'];
  if (typeof headerSecret === 'string') return headerSecret;
  if (Array.isArray(headerSecret)) return headerSecret[0];

  return undefined;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const connectionId = resolveConnectionId(req);
  const secret = resolveSecret(req);

  console.log('[forms-webhook-debug]', {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    connectionId: connectionId ?? null,
    secret: secret ?? null,
  });

  res.status(200).json({
    ok: true,
    debug: true,
    receivedAt: new Date().toISOString(),
  });
}
