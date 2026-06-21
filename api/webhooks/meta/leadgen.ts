import { getMetaVerifyToken } from '../_lib/supabaseAdmin';
import { processMetaLeadgenWebhook } from '../_lib/createLeadFromExternalSource';

export const config = { runtime: 'nodejs' };

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

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    const verifyToken = getMetaVerifyToken();

    if (mode === 'subscribe' && token && verifyToken && token === verifyToken && challenge) {
      return new Response(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }
    return new Response('Forbidden', { status: 403 });
  }

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body: MetaWebhookBody;
  try {
    body = (await request.json()) as MetaWebhookBody;
  } catch {
    return new Response('Bad request', { status: 400 });
  }

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

  return new Response(JSON.stringify({ received: true, results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
