import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  createIntegrationLog,
  isFinanceProvider,
  simulateWebhook,
} from '../../_lib/integrationServer';
import { appendIntegrationLog } from '../../_lib/integrationStore';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_INTEGRATION_SIMULATE !== '1') {
    res.status(403).json({ error: 'Simulate webhook disabled in production' });
    return;
  }

  try {
    const body = req.body as {
      providerId?: string;
      businessId?: string;
      connectionId?: string;
      invoiceId?: string;
      externalInvoiceId?: string;
      externalTransactionId?: string;
      event?: 'payment.success' | 'payment.failed';
      amount?: number;
    };

    if (!body.providerId || !isFinanceProvider(body.providerId)) {
      res.status(400).json({ error: 'Finance provider required' });
      return;
    }

    const event = body.event ?? 'payment.success';
    const result = simulateWebhook({
      invoiceId: body.invoiceId,
      externalInvoiceId: body.externalInvoiceId,
      externalTransactionId: body.externalTransactionId,
      event,
      amount: body.amount,
    });

    if (body.businessId) {
      appendIntegrationLog(
        createIntegrationLog({
          businessId: body.businessId,
          connectionId: body.connectionId,
          providerId: body.providerId,
          action: `webhook.simulate.${event}`,
          status: result.paymentStatus === 'failed' ? 'failed' : 'success',
          message: result.message ?? event,
          rawRequest: body,
          rawResponse: result,
        }),
      );
    }

    res.status(200).json({ ...result, providerId: body.providerId, amount: body.amount });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Simulate failed' });
  }
}
