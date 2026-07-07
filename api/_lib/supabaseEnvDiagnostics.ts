import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseEnvDiagnostics {
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

export interface SupabaseEnvDiagnosticsError {
  ok: false;
  error: string;
  stack: string;
  nodeEnv: string;
  vercelEnv: string;
}

function looksLikeSupabaseUrl(url: string): boolean {
  return url.startsWith('https://') && url.includes('.supabase.co');
}

function looksLikeServiceRoleKey(key: string): boolean {
  return key.startsWith('eyJ');
}

function deploymentUrlFromEnv(): string {
  const deploymentHost = process.env.VERCEL_URL?.trim();
  if (!deploymentHost) return '';
  return deploymentHost.startsWith('http') ? deploymentHost : `https://${deploymentHost}`;
}

function deriveStorageBackendReason(input: {
  supabaseUrlExists: boolean;
  serviceRoleExists: boolean;
  supabaseUrlLooksValid: boolean;
  serviceRoleLooksValid: boolean;
  supabaseClientCreated: boolean;
  testQuerySuccess: boolean;
  testQueryError: string;
}): string {
  if (!input.supabaseUrlExists) {
    return 'memory — SUPABASE_URL missing in server process.env (check Vercel env + redeploy)';
  }
  if (!input.serviceRoleExists) {
    return 'memory — SUPABASE_SERVICE_ROLE_KEY missing in server process.env';
  }
  if (!input.supabaseUrlLooksValid) {
    return 'memory — SUPABASE_URL format invalid (expected https://*.supabase.co)';
  }
  if (!input.serviceRoleLooksValid) {
    return 'memory — SUPABASE_SERVICE_ROLE_KEY format invalid (use service_role JWT, not anon key)';
  }
  if (!input.supabaseClientCreated) {
    return `memory — createClient failed: ${input.testQueryError || 'unknown error'}`;
  }
  if (!input.testQuerySuccess) {
    return `memory — Supabase query failed: ${input.testQueryError || 'external_form_connections unreachable'}`;
  }
  return 'supabase — env valid and external_form_connections query succeeded';
}

export async function runSupabaseEnvDiagnostics(): Promise<SupabaseEnvDiagnostics> {
  const rawUrl = process.env.SUPABASE_URL ?? '';
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  const url = rawUrl.trim();
  const key = rawKey.trim();

  const supabaseUrlExists = Boolean(rawUrl);
  const serviceRoleExists = Boolean(rawKey);
  const supabaseUrlLooksValid = Boolean(url) && looksLikeSupabaseUrl(url);
  const serviceRoleLooksValid = Boolean(key) && looksLikeServiceRoleKey(key);

  let supabaseClientCreated = false;
  let testQuerySuccess = false;
  let testQueryError = '';
  let client: SupabaseClient | null = null;

  if (supabaseUrlLooksValid && serviceRoleLooksValid) {
    try {
      client = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      supabaseClientCreated = Boolean(client);
    } catch (e) {
      testQueryError = e instanceof Error ? e.message : String(e);
    }
  }

  if (client) {
    try {
      const { error } = await client.from('external_form_connections').select('id').limit(1);
      if (error) {
        testQuerySuccess = false;
        testQueryError = error.message;
      } else {
        testQuerySuccess = true;
        testQueryError = '';
      }
    } catch (e) {
      testQuerySuccess = false;
      testQueryError = e instanceof Error ? e.message : String(e);
    }
  } else if (!testQueryError) {
    if (!supabaseUrlExists) {
      testQueryError = 'SUPABASE_URL is not set on the server';
    } else if (!serviceRoleExists) {
      testQueryError = 'SUPABASE_SERVICE_ROLE_KEY is not set on the server';
    } else if (!supabaseUrlLooksValid) {
      testQueryError = 'SUPABASE_URL must start with https:// and contain .supabase.co';
    } else if (!serviceRoleLooksValid) {
      testQueryError = 'SUPABASE_SERVICE_ROLE_KEY must start with eyJ (JWT service role key)';
    } else {
      testQueryError = 'Supabase client was not created';
    }
  }

  const storageBackendReason = deriveStorageBackendReason({
    supabaseUrlExists,
    serviceRoleExists,
    supabaseUrlLooksValid,
    serviceRoleLooksValid,
    supabaseClientCreated,
    testQuerySuccess,
    testQueryError,
  });

  return {
    ok: true,
    supabaseUrlExists,
    serviceRoleExists,
    supabaseUrlLooksValid,
    serviceRoleLooksValid,
    supabaseClientCreated,
    testQuerySuccess,
    testQueryError,
    nodeEnv: process.env.NODE_ENV ?? '',
    vercelEnv: process.env.VERCEL_ENV ?? '',
    deploymentUrl: deploymentUrlFromEnv(),
    storageBackendReason,
  };
}

export function supabaseEnvDiagnosticsErrorResponse(
  e: unknown,
): SupabaseEnvDiagnosticsError {
  const error = e instanceof Error ? e.message : String(e);
  const stack = e instanceof Error ? e.stack ?? '' : '';
  return {
    ok: false,
    error,
    stack,
    nodeEnv: process.env.NODE_ENV ?? '',
    vercelEnv: process.env.VERCEL_ENV ?? '',
  };
}
