import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  isFinanceProvider,
  isKnownProvider,
  parseWebhook,
} from '../../src/server/integrations/finance/integration.service';
import {
  markWebhookProcessed,
  webhookEventLog,
} from '../../src/server/integrations/finance/integrationCredentials.store';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const provider = String(req.query.provider ?? '').trim();

  if (!provider || !isKnownProvider(provider)) {
    res.status(400).json({ error: 'Missing or unknown provider' });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const payload = req.body;
    const externalId =
      (payload as { event_id?: string; id?: string })?.event_id ??
      (payload as { id?: string })?.id ??
      crypto.randomUUID();

    const dedupKey = `${provider}:${externalId}`;
    const isNew = markWebhookProcessed(dedupKey);

    webhookEventLog.push({
      id: crypto.randomUUID(),
      provider,
      externalEventId: externalId,
      receivedAt: new Date().toISOString(),
      rawPayload: payload,
    });

    if (!isNew) {
      res.status(200).json({ processed: false, duplicate: true });
      return;
    }

    const result = isFinanceProvider(provider) ? parseWebhook(payload) : { processed: true, duplicate: false };

    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Webhook failed' });
  }
}
