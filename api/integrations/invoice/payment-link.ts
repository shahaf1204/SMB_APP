import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createMockPaymentLink, isFinanceProvider } from '../../_lib/integrationServer';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
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
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Payment link failed' });
  }
}
