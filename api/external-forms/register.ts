import type { VercelRequest, VercelResponse } from '@vercel/node';
import { registerFormConnection } from '../../src/server/integrations/externalForms/externalForms.service';
import type { StoredFormConnection } from '../../src/server/integrations/externalForms/externalForms.types';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = req.body as {
      id?: string;
      businessId?: string;
      ownerId?: string;
      provider?: string;
      formName?: string;
      formUrl?: string;
      secretKey?: string;
      activityType?: string;
      isActive?: boolean;
      fieldMapping?: unknown[];
    };

    if (!body.id || !body.businessId || !body.ownerId || !body.provider || !body.formName || !body.secretKey) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const conn: StoredFormConnection = {
      id: body.id,
      businessId: body.businessId,
      ownerId: body.ownerId,
      provider: body.provider as StoredFormConnection['provider'],
      formName: body.formName,
      formUrl: body.formUrl,
      secretKey: body.secretKey,
      activityType: (body.activityType as StoredFormConnection['activityType']) ?? 'event',
      isActive: body.isActive ?? false,
      fieldMapping: (body.fieldMapping as StoredFormConnection['fieldMapping']) ?? [],
    };

    await registerFormConnection(conn);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Register failed' });
  }
}
