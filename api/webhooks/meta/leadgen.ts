import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processMetaLeadgenWebhookBatch } from '../../../src/server/integrations/leads/metaLead.processor';
import { parseMetaLeadgenChanges } from '../../../src/server/integrations/leads/metaWebhook.parse';
import { readRawRequestBody } from '../../../src/server/integrations/leads/metaWebhook.rawBody';
import {
  MetaWebhookSignatureError,
  verifyMetaWebhookSignature,
} from '../../../src/server/integrations/leads/metaWebhook.signature';
import { getMetaVerifyToken } from '../../../src/server/core/supabase.server';

export const config = {
  api: {
    bodyParser: false,
  },
};

function queryParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'GET') {
    const mode = queryParam(req.query['hub.mode']);
    const token = queryParam(req.query['hub.verify_token']);
    const challenge = queryParam(req.query['hub.challenge']);
    const verifyToken = getMetaVerifyToken();

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

  try {
    const rawBody = await readRawRequestBody(req);
    verifyMetaWebhookSignature(rawBody, req.headers as Record<string, string | string[] | undefined>);

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      res.status(400).json({ error: 'Invalid JSON body' });
      return;
    }

    if (!payload || typeof payload !== 'object') {
      res.status(400).json({ error: 'Bad request' });
      return;
    }

    const changes = parseMetaLeadgenChanges(payload as Parameters<typeof parseMetaLeadgenChanges>[0]);
    const receivedAt = new Date().toISOString();

    if (changes.length === 0) {
      res.status(200).json({ received: true, results: [] });
      return;
    }

    const { results, httpStatus } = await processMetaLeadgenWebhookBatch(changes, receivedAt);
    res.status(httpStatus).json({ received: true, results });
  } catch (error) {
    if (error instanceof MetaWebhookSignatureError) {
      res.status(error.httpStatus).json({ error: error.message });
      return;
    }
    console.error('Meta leadgen webhook failed', error);
    res.status(503).json({ error: 'Webhook processing failed' });
  }
}
