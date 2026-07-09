import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Self-contained register — no local imports (Vercel-safe). */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

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

    if (
      !body.id ||
      !body.businessId ||
      !body.ownerId ||
      !body.provider ||
      !body.formName ||
      !body.secretKey
    ) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const url = process.env.SUPABASE_URL?.trim();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!url || !key) {
      res.status(500).json({ error: 'Supabase not configured on server' });
      return;
    }

    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await sb.from('external_form_connections').upsert({
      id: body.id,
      business_id: body.businessId,
      owner_id: body.ownerId,
      provider: body.provider,
      form_name: body.formName,
      form_url: body.formUrl ?? null,
      webhook_url: '',
      secret_key: body.secretKey,
      activity_type: body.activityType ?? 'event',
      is_active: body.isActive ?? false,
      field_mapping: body.fieldMapping ?? [],
      updated_at: new Date().toISOString(),
    });

    if (error) {
      res.status(500).json({ error: `שמירת החיבור בענן נכשלה: ${error.message}` });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Register failed' });
  }
}
