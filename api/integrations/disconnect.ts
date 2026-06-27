import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isKnownProvider } from '../_lib/integrationServer';

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

    if (!isKnownProvider(provider)) {
      res.status(400).json({ error: `Unknown provider: ${provider}` });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Disconnect failed' });
  }
}
