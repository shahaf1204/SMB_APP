import type { VercelRequest, VercelResponse } from '@vercel/node';

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

function queryParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
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

  const { processMetaLeadgenWebhook } = await import('../../_lib/createLeadFromExternalSource');
  const entries = body.entry ?? [];
  const results: string[] = [];

  for (const entry of entries) {
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
