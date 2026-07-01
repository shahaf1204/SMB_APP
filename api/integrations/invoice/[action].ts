import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createMockInvoice, createMockPaymentLink, isFinanceProvider } from '../../_lib/integrationServer';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const action = String(req.query.action ?? '').trim();
  if (!action) {
    res.status(400).json({ error: 'Missing action' });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    switch (action) {
      case 'push':
        return handlePush(req, res);
      case 'payment-link':
        return handlePaymentLink(req, res);
      default:
        res.status(404).json({ error: `Unknown invoice action: ${action}` });
    }
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Invoice request failed' });
  }
}

async function handlePush(req: VercelRequest, res: VercelResponse): Promise<void> {
  const { provider, invoice } = req.body as {
    provider?: string;
    invoice?: {
      clientName: string;
      clientEmail?: string;
      amount: number;
      dueDate: string;
      notes?: string;
    };
  };

  if (!provider || !invoice) {
    res.status(400).json({ error: 'Missing fields' });
    return;
  }

  if (!isFinanceProvider(provider)) {
    res.status(400).json({ error: 'Not a finance provider' });
    return;
  }

  res.status(200).json(createMockInvoice(provider, invoice));
}

async function handlePaymentLink(req: VercelRequest, res: VercelResponse): Promise<void> {
  const { provider, providerDocumentId, amount } = req.body as {
    provider?: string;
    providerDocumentId?: string;
    amount?: number;
  };

  if (!provider || !providerDocumentId || typeof amount !== 'number') {
    res.status(400).json({ error: 'Missing fields' });
    return;
  }

  if (!isFinanceProvider(provider)) {
    res.status(400).json({ error: 'Not a finance provider' });
    return;
  }

  res.status(200).json(createMockPaymentLink(providerDocumentId, amount));
}
