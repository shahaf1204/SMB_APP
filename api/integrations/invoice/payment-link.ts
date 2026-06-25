import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFinanceProvider, isFinanceProvider } from '../../../src/integrations/core/registry';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { connectionId, provider, providerDocumentId, amount } = req.body as {
      connectionId?: string;
      provider?: string;
      providerDocumentId?: string;
      amount?: number;
    };

    if (!connectionId || !provider || !providerDocumentId || amount == null) {
      res.status(400).json({ error: 'Missing fields' });
      return;
    }

    if (!isFinanceProvider(provider as never)) {
      res.status(400).json({ error: 'Not a finance provider' });
      return;
    }

    const fp = getFinanceProvider(provider as never);
    const result = await fp.createPaymentLink(connectionId, providerDocumentId, amount);

    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Payment link failed' });
  }
}
