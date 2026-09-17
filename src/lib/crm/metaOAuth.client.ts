import { getSupabase, isSupabaseConfigured } from '../supabase';
import type {
  MetaOAuthAttemptPagesResponse,
  MetaOAuthSelectPageResponse,
} from '../../types/metaOAuth.client';
import { mapMetaOAuthErrorToUserMessage } from './metaOAuthUserMessages';

export class MetaOAuthClientError extends Error {
  readonly code: string;

  constructor(code: string, userMessage?: string) {
    super(userMessage ?? mapMetaOAuthErrorToUserMessage(code));
    this.name = 'MetaOAuthClientError';
    this.code = code;
  }
}

async function authHeaders(): Promise<HeadersInit> {
  if (!isSupabaseConfigured()) {
    throw new MetaOAuthClientError('configuration_error');
  }
  const { data } = await getSupabase().auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new MetaOAuthClientError('not_authenticated');
  }
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function parseApiError(json: { error?: string; message?: string }, fallback: string): MetaOAuthClientError {
  const code = json.error?.trim() || fallback;
  return new MetaOAuthClientError(code);
}

export async function startMetaOAuth(businessId: string): Promise<string> {
  const headers = await authHeaders();
  const res = await fetch('/api/integrations/meta/oauth/start', {
    method: 'POST',
    headers,
    body: JSON.stringify({ businessId }),
  });
  const json = (await res.json()) as { authorizationUrl?: string; error?: string; message?: string };
  if (!res.ok || !json.authorizationUrl) {
    throw parseApiError(json, 'oauth_start_failed');
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
  const json = (await res.json()) as MetaOAuthAttemptPagesResponse & { error?: string; message?: string };
  if (!res.ok) {
    throw parseApiError(json, 'attempt_load_failed');
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
    throw parseApiError(json, 'page_selection_failed');
  }
  return json;
}
