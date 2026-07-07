import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runSupabaseEnvDiagnostics } from '../_lib/supabaseEnvDiagnostics';

/** Temporary diagnostics — safe booleans only, no secret values. */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const diagnostics = await runSupabaseEnvDiagnostics();

  console.log('[supabase-env-diagnostics]', diagnostics);

  res.status(200).json(diagnostics);
}
