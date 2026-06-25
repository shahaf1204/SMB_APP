import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBusinessProvider, isFinanceProvider } from '../../src/integrations/core/registry';
import type { ProviderId } from '../../src/types/integrations';
import { markWebhookProcessed, webhookEventLog } from '../_lib/integrationStore';
import { createId } from '../../src/lib/ids';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const provider = (req.query.provider ?? req.url?.split('/').pop()) as ProviderId | undefined;

  if (!provider) {
    res.status(400).json({ error: 'Missing provider' });
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
      createId();

    const dedupKey = `${provider}:${externalId}`;
    const isNew = markWebhookProcessed(dedupKey);

    webhookEventLog.push({
      id: createId(),
      provider,
      externalEventId: externalId,
      receivedAt: new Date().toISOString(),
      rawPayload: payload,
    });

    if (!isNew) {
      res.status(200).json({ processed: false, duplicate: true });
      return;
    }

    let result = { processed: true, duplicate: false, paymentStatus: 'paid' };

    if (isFinanceProvider(provider)) {
      const fp = getBusinessProvider(provider);
      if ('handleWebhook' in fp && typeof fp.handleWebhook === 'function') {
        result = await (fp as { handleWebhook: (p: unknown, h: Record<string, string>) => Promise<typeof result> }).handleWebhook(
          payload,
          req.headers as Record<string, string>,
        );
      }
    }

    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Webhook failed' });
  }
}
