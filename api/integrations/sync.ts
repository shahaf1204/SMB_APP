import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBusinessProvider } from '../../src/integrations/core/registry';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { connectionId, provider } = req.body as {
      connectionId?: string;
      provider?: string;
    };

    if (!connectionId || !provider) {
      res.status(400).json({ error: 'Missing connectionId or provider' });
      return;
    }

    const p = getBusinessProvider(provider as never);
    const result = await p.sync(connectionId);

    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Sync failed' });
  }
}
