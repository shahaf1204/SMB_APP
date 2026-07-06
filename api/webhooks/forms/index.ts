import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleFormsWebhook } from '../../_lib/formsWebhookHandler';

/** POST /api/webhooks/forms?connectionId=...&secret=... */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  await handleFormsWebhook(req, res);
}
