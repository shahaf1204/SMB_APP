import { createMockPaymentLink, isFinanceProvider } from '../../_lib/integrationServer';

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
      provider?: string;
      providerDocumentId?: string;
      amount?: number;
    };

    if (!body.provider || !body.providerDocumentId || body.amount == null) {
      return json({ error: 'Missing fields' }, 400);
    }

    if (!isFinanceProvider(body.provider)) {
      return json({ error: 'Not a finance provider' }, 400);
    }

    return json(createMockPaymentLink(body.providerDocumentId, body.amount));
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Payment link failed' }, 500);
  }
}
