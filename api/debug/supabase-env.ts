import type { VercelRequest, VercelResponse } from '@vercel/node';

interface SupabaseEnvResponse {
  ok: boolean;
  supabaseUrlExists: boolean;
  serviceRoleExists: boolean;
  supabaseClientCreated: boolean;
  testQuerySuccess: boolean;
  error: string | null;
}

function jsonResponse(
  overrides: Partial<SupabaseEnvResponse> & { ok: boolean },
): SupabaseEnvResponse {
  return {
    supabaseUrlExists: false,
    serviceRoleExists: false,
    supabaseClientCreated: false,
    testQuerySuccess: false,
    error: null,
    ...overrides,
  };
}

async function runDiagnostics(): Promise<SupabaseEnvResponse> {
  const rawUrl = process.env.SUPABASE_URL ?? '';
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  const url = rawUrl.trim();
  const key = rawKey.trim();

  const supabaseUrlExists = Boolean(url);
  const serviceRoleExists = Boolean(key);

  if (!supabaseUrlExists) {
    return jsonResponse({
      ok: false,
      supabaseUrlExists,
      serviceRoleExists,
      error: 'SUPABASE_URL is not set on the server',
    });
  }

  if (!serviceRoleExists) {
    return jsonResponse({
      ok: false,
      supabaseUrlExists,
      serviceRoleExists,
      error: 'SUPABASE_SERVICE_ROLE_KEY is not set on the server',
    });
  }

  let supabaseClientCreated = false;
  let testQuerySuccess = false;
  let error: string | null = null;

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    supabaseClientCreated = Boolean(client);

    const { error: queryError } = await client
      .from('external_form_connections')
      .select('id')
      .limit(1);

    if (queryError) {
      error = queryError.message;
    } else {
      testQuerySuccess = true;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const ok =
    supabaseUrlExists &&
    serviceRoleExists &&
    supabaseClientCreated &&
    testQuerySuccess &&
    !error;

  return jsonResponse({
    ok,
    supabaseUrlExists,
    serviceRoleExists,
    supabaseClientCreated,
    testQuerySuccess,
    error,
  });
}

/** Self-contained diagnostics — no shared project imports; always returns JSON. */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method !== 'GET') {
      res.status(405).json(jsonResponse({ ok: false, error: 'Method not allowed' }));
      return;
    }

    const result = await runDiagnostics();
    res.status(200).json(result);
  } catch (fatal) {
    res.status(200).json(
      jsonResponse({
        ok: false,
        error: fatal instanceof Error ? fatal.message : String(fatal),
      }),
    );
  }
}
