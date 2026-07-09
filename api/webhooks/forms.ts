import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Dedicated Forms.app webhook — dynamic import avoids Vercel cold-start module failures. */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'GET') {
    res.status(200).json({ ok: true, route: 'forms-webhook' });
    return;
  }

  try {
    const { processFormsWebhook } = await import('../_lib/external-forms/webhook');
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
