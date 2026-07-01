import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createConnection, createIntegrationLog, isKnownProvider } from '../_lib/integrationServer';
import { appendIntegrationLog, encryptApiKey, storeCredentials } from '../_lib/integrationStore';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

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

    const connection = createConnection({
      businessId: body.businessId,
      userId: body.userId,
      provider: body.provider,
      apiKey: body.apiKey,
      accountLabel: body.accountLabel,
    });

    if (body.apiKey?.trim()) {
      storeCredentials({
        connectionId: connection.id,
        businessId: body.businessId,
        providerId: connection.providerId,
        apiKeyEncrypted: encryptApiKey(body.apiKey.trim()),
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
