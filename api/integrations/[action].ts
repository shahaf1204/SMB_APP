import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  createConnection,
  createIntegrationLog,
  isFinanceProvider,
  isKnownProvider,
  simulateWebhook,
  syncConnection,
  testConnection,
} from '../_lib/integrationServer';
import {
  appendIntegrationLog,
  decryptApiKey,
  encryptApiKey,
  getCredentials,
  getIntegrationLogs,
  storeCredentials,
} from '../_lib/integrationStore';
import { morningAuthFromStored, resolveMorningAuth, testMorningAuth } from '../_lib/morningApi';

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
      case 'connect':
        return handleConnect(req, res);
      case 'disconnect':
        return handleDisconnect(req, res);
      case 'sync':
        return handleSync(req, res);
      case 'logs':
        return handleLogs(req, res);
      case 'test-connection':
        return handleTestConnection(req, res);
      case 'simulate':
        return handleSimulate(req, res);
      default:
        res.status(404).json({ error: `Unknown action: ${action}` });
    }
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Integration request failed' });
  }
}

async function handleConnect(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
  const body = req.body as {
    businessId?: string;
    userId?: string;
    provider?: string;
    apiKey?: string;
    accountLabel?: string;
  };

  if (!body.businessId || !body.userId || !body.provider) {
    res.status(400).json({ error: 'Missing businessId, userId, or provider' });
    return;
  }

  if (!isKnownProvider(body.provider)) {
    res.status(400).json({ error: `Unknown provider: ${body.provider}` });
    return;
  }

  let morningBaseUrl: string | undefined;
  if (body.provider === 'morning' && body.apiKey?.trim()) {
    const auth = await resolveMorningAuth(body.apiKey.trim());
    morningBaseUrl = auth.baseUrl;
  }

  const connection = createConnection({
    businessId: body.businessId,
    userId: body.userId,
    provider: body.provider,
    apiKey: body.apiKey,
    accountLabel: body.accountLabel,
  });

  if (morningBaseUrl) {
    connection.mode = morningBaseUrl.includes('sandbox') ? 'sandbox' : 'production';
  }

  if (body.apiKey?.trim()) {
    storeCredentials({
      connectionId: connection.id,
      businessId: body.businessId,
      providerId: connection.providerId,
      apiKeyEncrypted: encryptApiKey(body.apiKey.trim()),
      apiBaseUrl: morningBaseUrl,
    });
  }

  appendIntegrationLog(
    createIntegrationLog({
      businessId: body.businessId,
      connectionId: connection.id,
      providerId: connection.providerId,
      action: 'connect',
      status: 'success',
      message: `חובר ${connection.providerName}`,
    }),
  );

  res.status(200).json({ connection });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Connect failed' });
  }
}

async function handleDisconnect(req: VercelRequest, res: VercelResponse): Promise<void> {
  const { connectionId, businessId, provider } = req.body as {
    connectionId?: string;
    businessId?: string;
    provider?: string;
  };

  if (!connectionId || !businessId || !provider) {
    res.status(400).json({ error: 'Missing fields' });
    return;
  }

  if (!isKnownProvider(provider)) {
    res.status(400).json({ error: `Unknown provider: ${provider}` });
    return;
  }

  res.status(200).json({ ok: true });
}

async function handleSync(req: VercelRequest, res: VercelResponse): Promise<void> {
  const { connectionId, provider } = req.body as {
    connectionId?: string;
    provider?: string;
  };

  if (!connectionId || !provider) {
    res.status(400).json({ error: 'Missing connectionId or provider' });
    return;
  }

  if (!isKnownProvider(provider)) {
    res.status(400).json({ error: `Unknown provider: ${provider}` });
    return;
  }

  res.status(200).json(syncConnection());
}

async function handleLogs(req: VercelRequest, res: VercelResponse): Promise<void> {
  const { businessId, limit } = req.body as { businessId?: string; limit?: number };
  if (!businessId) {
    res.status(400).json({ error: 'Missing businessId' });
    return;
  }

  res.status(200).json({ logs: getIntegrationLogs(businessId, limit ?? 50) });
}

async function handleTestConnection(req: VercelRequest, res: VercelResponse): Promise<void> {
  const { provider, connectionId } = req.body as {
    provider?: string;
    connectionId?: string;
    businessId?: string;
  };
  if (!provider || !isKnownProvider(provider)) {
    res.status(400).json({ error: 'Missing or unknown provider' });
    return;
  }

  if (provider === 'morning' && connectionId) {
    const creds = getCredentials(connectionId);
    if (creds?.apiKeyEncrypted) {
      const auth = morningAuthFromStored(decryptApiKey(creds.apiKeyEncrypted), creds.apiBaseUrl);
      const result = await testMorningAuth(auth);
      res.status(200).json(result);
      return;
    }
  }

  res.status(200).json(testConnection(provider));
}

async function handleSimulate(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_INTEGRATION_SIMULATE !== '1') {
    res.status(403).json({ error: 'Simulate webhook disabled in production' });
    return;
  }

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
}
