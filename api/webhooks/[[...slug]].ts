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
import { processMetaLeadgenWebhook } from '../../src/server/integrations/leads/metaLead.service';

interface MetaWebhookEntry {
  id?: string;
  changes?: Array<{
    field?: string;
    value?: {
      leadgen_id?: string;
      page_id?: string;
      form_id?: string;
    };
  }>;
}

interface MetaWebhookBody {
  object?: string;
  entry?: MetaWebhookEntry[];
}

function slugParts(req: VercelRequest): string[] {
  const slug = req.query.slug;
  if (!slug) return [];
  return Array.isArray(slug) ? slug.map(String) : [String(slug)];
}

function queryParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

async function handleFormsWebhook(_req: VercelRequest, res: VercelResponse): Promise<void> {
  res.status(410).json({
    ok: false,
    error: 'Use /api/webhooks/forms for Forms.app webhooks',
  });
}

async function handleMetaLeadgen(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'GET') {
    const mode = queryParam(req.query['hub.mode']);
    const token = queryParam(req.query['hub.verify_token']);
    const challenge = queryParam(req.query['hub.challenge']);
    const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN ?? '';

    if (mode === 'subscribe' && token && verifyToken && token === verifyToken && challenge) {
      res.status(200).setHeader('Content-Type', 'text/plain').send(challenge);
      return;
    }
    res.status(403).send('Forbidden');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  const body = req.body as MetaWebhookBody | undefined;
  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'Bad request' });
    return;
  }

  const results: string[] = [];
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== 'leadgen') continue;
      const leadgenId = change.value?.leadgen_id;
      const pageId = change.value?.page_id;
      const formId = change.value?.form_id;
      if (!leadgenId || !pageId) continue;

      try {
        const result = await processMetaLeadgenWebhook(leadgenId, pageId, formId);
        results.push(result.ok ? 'ok' : result.reason ?? 'error');
      } catch (e) {
        console.error('leadgen processing failed', e);
        results.push('error');
      }
    }
  }

  res.status(200).json({ received: true, results });
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
    await handleMetaLeadgen(req, res);
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
