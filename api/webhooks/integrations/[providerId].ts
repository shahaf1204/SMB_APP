import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  createIntegrationLog,
  isFinanceProvider,
  isKnownProvider,
  parseWebhook,
} from '../../../src/server/integrations/finance/integration.service';
import {
  appendIntegrationLog,
  markWebhookProcessed,
} from '../../../src/server/integrations/finance/integrationCredentials.store';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const providerId = String(req.query.providerId ?? '').trim();

  if (!providerId || !isKnownProvider(providerId)) {
    res.status(400).json({ error: 'Missing or unknown providerId' });
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

    const dedupKey = `${providerId}:${externalId}`;
    const isNew = markWebhookProcessed(dedupKey);

    if (!isNew) {
      res.status(200).json({ processed: false, duplicate: true });
      return;
    }

    const result = isFinanceProvider(providerId) ? parseWebhook(payload) : { processed: true, duplicate: false };

    const businessId = (payload as { business_id?: string })?.business_id;
    if (businessId) {
      appendIntegrationLog(
        createIntegrationLog({
          businessId,
          providerId,
          action: 'webhook.received',
          status: result.paymentStatus === 'failed' ? 'failed' : 'success',
          message: result.message ?? 'Webhook processed',
          rawRequest: payload,
          rawResponse: result,
        }),
      );
    }

    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Webhook failed' });
  }
}
