import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Polling disabled — forms use direct webhook creation in app_snapshots. */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'GET') {
    res.status(200).json({
      submissions: [],
      debug: {
        storage: 'supabase',
        storageReason: 'direct webhook — no queue polling',
        pendingCount: 0,
        lastWebhookAt: null,
        lastWebhookPreview: null,
      },
    });
    return;
  }

  if (req.method === 'POST') {
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
