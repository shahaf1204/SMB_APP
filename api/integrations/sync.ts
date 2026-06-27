import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isKnownProvider, syncConnection } from '../_lib/integrationServer';

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

    if (!isKnownProvider(provider)) {
      res.status(400).json({ error: `Unknown provider: ${provider}` });
      return;
    }

    const result = syncConnection();
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Sync failed' });
  }
}
