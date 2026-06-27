import { isKnownProvider } from '../_lib/integrationServer';

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
      connectionId?: string;
      businessId?: string;
      provider?: string;
    };

    if (!body.connectionId || !body.businessId || !body.provider) {
      return json({ error: 'Missing fields' }, 400);
    }

    if (!isKnownProvider(body.provider)) {
      return json({ error: `Unknown provider: ${body.provider}` }, 400);
    }

    return json({ ok: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Disconnect failed' }, 500);
  }
}
