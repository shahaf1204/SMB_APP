export interface SupabaseEnvDiagnostics {
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

export async function fetchSupabaseEnvDiagnostics(): Promise<SupabaseEnvDiagnostics | null> {
  try {
    const res = await fetch('/api/debug/supabase-env');
    if (!res.ok) return null;
    return (await res.json()) as SupabaseEnvDiagnostics;
  } catch {
    return null;
  }
}
