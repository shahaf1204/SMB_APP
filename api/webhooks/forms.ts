import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processFormsWebhook } from '../external-forms/webhook';

/**
 * POST /api/webhooks/forms?connectionId=...&secret=...
 * Legacy path /api/webhooks/forms/:connectionId is rewritten via vercel.json
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const result = await processFormsWebhook(req);
    res.status(result.status).json(result.body);
  } catch (e) {
    console.error('[FORMS_PARSE_ERROR]', {
      stage: 'handler_fatal',
      error: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
    });
    res.status(200).json({
      processed: false,
      error: e instanceof Error ? e.message : 'Webhook handler failed',
      parseStage: 'handler_fatal',
    });
  }
}
