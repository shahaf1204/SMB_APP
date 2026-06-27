import {
  createConnection,
  isKnownProvider,
  type IntegrationConnection,
} from '../_lib/integrationServer';

export const config = { runtime: 'edge' };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = (await request.json()) as {
      businessId?: string;
      userId?: string;
      provider?: string;
      apiKey?: string;
      accountLabel?: string;
    };

    if (!body.businessId || !body.userId || !body.provider) {
      return json({ error: 'Missing businessId, userId, or provider' }, 400);
    }

    if (!isKnownProvider(body.provider)) {
      return json({ error: `Unknown provider: ${body.provider}` }, 400);
    }

    const connection: IntegrationConnection = createConnection({
      businessId: body.businessId,
      userId: body.userId,
      provider: body.provider,
      apiKey: body.apiKey,
      accountLabel: body.accountLabel,
    });

    return json({ connection });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Connect failed' }, 500);
  }
}
