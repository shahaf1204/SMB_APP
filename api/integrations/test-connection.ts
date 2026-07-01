import type { VercelRequest, VercelResponse } from '@vercel/node';
import { testConnection, isKnownProvider } from '../_lib/integrationServer';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { provider } = req.body as { provider?: string; connectionId?: string; businessId?: string };
    if (!provider || !isKnownProvider(provider)) {
      res.status(400).json({ error: 'Missing or unknown provider' });
      return;
    }

    res.status(200).json(testConnection(provider));
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Test failed' });
  }
}
