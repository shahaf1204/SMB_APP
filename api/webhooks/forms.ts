import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processFormsWebhook } from '../_lib/external-forms/webhook';

/** Dedicated Forms.app webhook — bundled via api/_lib (Vercel-safe). Always returns 200 on POST. */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const result = await processFormsWebhook(req);
    const status = req.method === 'POST' ? 200 : result.status;
    res.status(status).json(result.body);
  } catch (e) {
    console.error('[FORMS_WEBHOOK_FATAL]', e);
    res.status(req.method === 'POST' ? 200 : 500).json({
      ok: false,
      error: e instanceof Error ? e.message : 'Webhook handler failed',
    });
  }
}
