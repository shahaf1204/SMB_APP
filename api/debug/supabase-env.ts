import type { VercelRequest, VercelResponse } from '@vercel/node';

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

    let runSupabaseEnvDiagnostics: (typeof import('../_lib/supabaseEnvDiagnostics'))['runSupabaseEnvDiagnostics'];
    let supabaseEnvDiagnosticsErrorResponse: (typeof import('../_lib/supabaseEnvDiagnostics'))['supabaseEnvDiagnosticsErrorResponse'];

    try {
      const mod = await import('../_lib/supabaseEnvDiagnostics');
      runSupabaseEnvDiagnostics = mod.runSupabaseEnvDiagnostics;
      supabaseEnvDiagnosticsErrorResponse = mod.supabaseEnvDiagnosticsErrorResponse;
    } catch (importError) {
      const payload = {
        ok: false as const,
        error:
          importError instanceof Error
            ? `Failed to load diagnostics module: ${importError.message}`
            : `Failed to load diagnostics module: ${String(importError)}`,
        stack: importError instanceof Error ? importError.stack ?? '' : '',
        nodeEnv,
        vercelEnv,
      };
      console.error('[supabase-env-diagnostics] import failed', payload);
      res.status(200).json(payload);
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
