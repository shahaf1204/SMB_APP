import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createMockInvoice, createMockPaymentLink, isFinanceProvider } from '../../_lib/integrationServer';
import { decryptApiKey, getCredentials } from '../../_lib/integrationStore';
import { createMorningInvoice, morningAuthFromStored } from '../../_lib/morningApi';
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
  const { provider, connectionId, invoice } = req.body as {
    provider?: string;
    connectionId?: string;
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

  if (provider === 'morning' && connectionId) {
    const stored = getCredentials(connectionId);
    if (stored?.apiKeyEncrypted) {
      const auth = morningAuthFromStored(decryptApiKey(stored.apiKeyEncrypted), stored.apiBaseUrl);
      const doc = await createMorningInvoice(auth, invoice);
      res.status(200).json({
        ...doc,
        paymentLink: doc.paymentLink ?? doc.paymentUrl,
        paymentUrl: doc.paymentUrl ?? doc.paymentLink,
      });
      return;
    }
    res.status(400).json({ error: 'חסרים פרטי חיבור Morning — התחברי מחדש עם מפתח API' });
    return;
  }

  if (provider !== 'mock_finance' && provider !== 'mock') {
    res.status(400).json({
      error: 'הפקת חשבונית לספק זה עדיין לא זמינה — השתמשי ב-Morning או בספק בדיקות',
    });
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
