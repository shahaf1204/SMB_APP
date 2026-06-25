import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBusinessProvider } from '../../src/integrations/core/registry';
import type { ProviderId } from '../../src/types/integrations';
import { encryptApiKey, storeCredentials } from '../_lib/integrationStore';
import { createId } from '../../src/lib/ids';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = req.body as {
      businessId?: string;
      userId?: string;
      provider?: ProviderId;
      apiKey?: string;
      accountLabel?: string;
    };

    if (!body.businessId || !body.userId || !body.provider) {
      res.status(400).json({ error: 'Missing businessId, userId, or provider' });
      return;
    }

    const provider = getBusinessProvider(body.provider);
    const connection = await provider.connect({
      apiKey: body.apiKey,
      accountLabel: body.accountLabel ?? body.provider,
    });

    connection.businessId = body.businessId;
    connection.userId = body.userId;
    connection.id = createId();

    if (body.apiKey) {
      storeCredentials({
        connectionId: connection.id,
        businessId: body.businessId,
        provider: body.provider,
        apiKeyEncrypted: encryptApiKey(body.apiKey),
      });
    }

    res.status(200).json({ connection });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Connect failed' });
  }
}
