import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleFormsWebhookRequest } from '../../src/server/integrations/externalForms/externalForms.service';

/**
 * POST /api/webhooks/forms?connectionId=...&secret=...
 * Legacy path /api/webhooks/forms/:connectionId is rewritten via vercel.json
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const pathConnectionId =
    typeof req.query.connectionId === 'string' ? req.query.connectionId.trim() : undefined;

  const result = await handleFormsWebhookRequest({
    method: req.method,
    body: req.body,
    query: req.query as Record<string, string | string[] | undefined>,
    headers: req.headers as Record<string, string | string[] | undefined>,
    url: req.url,
    pathConnectionId,
  });

  res.status(result.status).json(result.body);
}
