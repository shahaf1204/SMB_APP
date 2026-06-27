import { createMockInvoice, isFinanceProvider } from '../_lib/integrationServer';

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
      invoice?: {
        clientName: string;
        clientEmail?: string;
        amount: number;
        dueDate: string;
        notes?: string;
      };
    };

    if (!body.provider || !body.invoice) {
      return json({ error: 'Missing fields' }, 400);
    }

    if (!isFinanceProvider(body.provider)) {
      return json({ error: 'Not a finance provider' }, 400);
    }

    return json(createMockInvoice(body.provider, body.invoice));
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Push invoice failed' }, 500);
  }
}
