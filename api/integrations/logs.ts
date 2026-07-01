import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getIntegrationLogs } from '../_lib/integrationStore';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { businessId, limit } = req.body as { businessId?: string; limit?: number };
  if (!businessId) {
    res.status(400).json({ error: 'Missing businessId' });
    return;
  }

  res.status(200).json({ logs: getIntegrationLogs(businessId, limit ?? 50) });
}
