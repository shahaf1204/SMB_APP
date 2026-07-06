import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleFormsWebhook } from '../../_lib/formsWebhookHandler';

/** POST /api/webhooks/forms/{connectionId}?secret=... (legacy path format) */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const pathConnectionId = String(req.query.connectionId ?? '').trim() || undefined;
  await handleFormsWebhook(req, res, { pathConnectionId });
}
