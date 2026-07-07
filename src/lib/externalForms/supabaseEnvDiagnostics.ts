export interface SupabaseEnvDiagnosticsSuccess {
  ok: true;
  supabaseUrlExists: boolean;
  serviceRoleExists: boolean;
  supabaseUrlLooksValid: boolean;
  serviceRoleLooksValid: boolean;
  supabaseClientCreated: boolean;
  testQuerySuccess: boolean;
  testQueryError: string;
  nodeEnv: string;
  vercelEnv: string;
  deploymentUrl: string;
  storageBackendReason: string;
}

export interface SupabaseEnvDiagnosticsFailure {
  ok: false;
  error: string;
  stack: string;
  nodeEnv: string;
  vercelEnv: string;
}

export type SupabaseEnvDiagnosticsResponse =
  | SupabaseEnvDiagnosticsSuccess
  | SupabaseEnvDiagnosticsFailure;

export async function fetchSupabaseEnvDiagnostics(): Promise<SupabaseEnvDiagnosticsResponse | null> {
  try {
    const res = await fetch('/api/debug/supabase-env');
    const text = await res.text();
    try {
      return JSON.parse(text) as SupabaseEnvDiagnosticsResponse;
    } catch {
      return {
        ok: false,
        error: `Non-JSON response (${res.status}): ${text.slice(0, 300)}`,
        stack: '',
        nodeEnv: '',
        vercelEnv: '',
      };
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack ?? '' : '',
      nodeEnv: '',
      vercelEnv: '',
    };
  }
}
