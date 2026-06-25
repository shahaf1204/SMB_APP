import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBusinessProvider } from '../../src/integrations/core/registry';
import { deleteCredentials } from '../_lib/integrationStore';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { connectionId, businessId, provider } = req.body as {
      connectionId?: string;
      businessId?: string;
      provider?: string;
    };

    if (!connectionId || !businessId || !provider) {
      res.status(400).json({ error: 'Missing fields' });
      return;
    }

    const p = getBusinessProvider(provider as never);
    await p.disconnect(connectionId);
    deleteCredentials(connectionId);

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Disconnect failed' });
  }
}
