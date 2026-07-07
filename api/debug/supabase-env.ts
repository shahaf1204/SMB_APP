import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  runSupabaseEnvDiagnostics,
  supabaseEnvDiagnosticsErrorResponse,
} from '../_lib/supabaseEnvDiagnostics';

/** Temporary diagnostics — always returns JSON, never throws. */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const nodeEnv = process.env.NODE_ENV ?? '';
  const vercelEnv = process.env.VERCEL_ENV ?? '';

  try {
    if (req.method !== 'GET') {
      res.status(405).json({
        ok: false,
        error: 'Method not allowed',
        stack: '',
        nodeEnv,
        vercelEnv,
      });
      return;
    }

    try {
      const diagnostics = await runSupabaseEnvDiagnostics();
      console.log('[supabase-env-diagnostics]', diagnostics);
      res.status(200).json(diagnostics);
    } catch (runError) {
      const payload = supabaseEnvDiagnosticsErrorResponse(runError);
      console.error('[supabase-env-diagnostics] run failed', payload);
      res.status(200).json(payload);
    }
  } catch (fatalError) {
    const payload = {
      ok: false as const,
      error: fatalError instanceof Error ? fatalError.message : String(fatalError),
      stack: fatalError instanceof Error ? fatalError.stack ?? '' : '',
      nodeEnv,
      vercelEnv,
    };
    console.error('[supabase-env-diagnostics] handler fatal', payload);
    res.status(200).json(payload);
  }
}
