import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  createIntegrationLog,
  isFinanceProvider,
  isKnownProvider,
  parseWebhook,
} from '../../src/server/integrations/finance/integration.service';
import {
  appendIntegrationLog,
  markWebhookProcessed,
  webhookEventLog,
} from '../../src/server/integrations/finance/integrationCredentials.store';
import {
  META_LEADGEN_LEGACY_POST_ERROR,
  META_LEADGEN_LEGACY_POST_STATUS,
} from '../../src/server/integrations/leads/metaWebhook.routing';
function slugParts(req: VercelRequest): string[] {
  const slug = req.query.slug;
  if (!slug) return [];
  return Array.isArray(slug) ? slug.map(String) : [String(slug)];
}

async function handleFormsWebhook(_req: VercelRequest, res: VercelResponse): Promise<void> {
  res.status(410).json({
    ok: false,
    error: 'Use /api/webhooks/forms for Forms.app webhooks',
  });
}

async function handleMetaLeadgenLegacy(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'GET') {
    res.status(307).setHeader('Location', '/api/webhooks/meta/leadgen').end();
    return;
  }
  res.status(META_LEADGEN_LEGACY_POST_STATUS).json({
    error: META_LEADGEN_LEGACY_POST_ERROR,
  });
}

async function handleIntegrationWebhook(
  req: VercelRequest,
  res: VercelResponse,
  providerId: string,
): Promise<void> {
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

async function handleProviderWebhook(
  req: VercelRequest,
  res: VercelResponse,
  provider: string,
): Promise<void> {
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

/** Single webhook router — /api/webhooks/forms, /meta/leadgen, /integrations/:id, /:provider */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const parts = slugParts(req);

  if (parts[0] === 'forms') {
    await handleFormsWebhook(req, res);
    return;
  }

  if (parts[0] === 'meta' && parts[1] === 'leadgen') {
    await handleMetaLeadgenLegacy(req, res);
    return;
  }

  if (parts[0] === 'integrations' && parts[1]) {
    await handleIntegrationWebhook(req, res, parts[1]);
    return;
  }

  const providerFromQuery = String(req.query.provider ?? '').trim();
  const providerFromPath = parts[0] ?? '';
  const provider = providerFromQuery || providerFromPath;

  if (provider) {
    await handleProviderWebhook(req, res, provider);
    return;
  }

  res.status(404).json({ error: 'Unknown webhook route' });
}
