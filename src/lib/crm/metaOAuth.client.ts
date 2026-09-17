import { getSupabase, isSupabaseConfigured } from '../supabase';
import type {
  MetaOAuthAttemptPagesResponse,
  MetaOAuthSelectPageResponse,
} from '../../types/metaOAuth.client';

async function authHeaders(): Promise<HeadersInit> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }
  const { data } = await getSupabase().auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error('not_authenticated');
  }
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function startMetaOAuth(businessId: string): Promise<string> {
  const headers = await authHeaders();
  const res = await fetch('/api/integrations/meta/oauth/start', {
    method: 'POST',
    headers,
    body: JSON.stringify({ businessId }),
  });
  const json = (await res.json()) as { authorizationUrl?: string; error?: string };
  if (!res.ok || !json.authorizationUrl) {
    throw new Error(json.error ?? 'oauth_start_failed');
  }
  return json.authorizationUrl;
}

export async function fetchMetaOAuthPageCandidates(
  attemptId: string,
  businessId: string,
): Promise<MetaOAuthAttemptPagesResponse> {
  const headers = await authHeaders();
  const params = new URLSearchParams({ attemptId, businessId });
  const res = await fetch(`/api/integrations/meta/oauth/attempt?${params.toString()}`, {
    headers,
  });
  const json = (await res.json()) as MetaOAuthAttemptPagesResponse & { error?: string };
  if (!res.ok) {
    throw new Error(json.error ?? 'attempt_load_failed');
  }
  return json;
}

export async function submitMetaOAuthPageSelection(input: {
  attemptId: string;
  pageId: string;
  businessId: string;
}): Promise<MetaOAuthSelectPageResponse> {
  const headers = await authHeaders();
  const res = await fetch('/api/integrations/meta/oauth/select-page', {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });
  const json = (await res.json()) as MetaOAuthSelectPageResponse & { error?: string; message?: string };
  if (!res.ok) {
    throw new Error(json.message ?? json.error ?? 'page_selection_failed');
  }
  return json;
}
