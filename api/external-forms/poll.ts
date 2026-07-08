import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  acknowledgeSubmissions,
  getPendingSubmissions,
  getServerPipelineDebug,
} from './store';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method === 'GET') {
      const businessId = String(req.query.businessId ?? '').trim();
      if (!businessId) {
        res.status(400).json({ error: 'Missing businessId' });
        return;
      }

      const submissions = await getPendingSubmissions(businessId);
      const debug = await getServerPipelineDebug(businessId);

      console.log('[PENDING_POLLED]', {
        businessId,
        count: submissions.length,
        storage: debug.storage,
        timestamp: new Date().toISOString(),
      });

      res.status(200).json({ submissions, debug });
      return;
    }

    if (req.method === 'POST') {
      const { ids } = req.body as { ids?: string[] };
      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ error: 'Missing ids' });
        return;
      }
      await acknowledgeSubmissions(ids);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('[external-forms/poll]', e);
    res.status(200).json({
      submissions: [],
      debug: {
        storage: 'memory',
        storageReason: e instanceof Error ? e.message : String(e),
        pendingCount: 0,
        lastWebhookAt: null,
        lastWebhookPreview: null,
      },
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
