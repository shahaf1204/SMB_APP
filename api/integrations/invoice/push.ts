import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createMockInvoice, isFinanceProvider } from '../../_lib/integrationServer';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
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
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Push invoice failed' });
  }
}
