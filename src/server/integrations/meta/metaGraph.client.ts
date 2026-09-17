import { getMetaAppSecret } from '../../core/supabase.server';
import {
  getMetaAppId,
  metaFacebookOAuthDialogUrl,
  metaGraphApiBaseUrl,
  metaLeadgenWebhookFields,
  metaOAuthScopeString,
} from '../../core/meta.config.server';

export interface MetaOAuthTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

export interface MetaGraphPageAccount {
  id: string;
  name: string;
  access_token: string;
}

export interface MetaGraphAccountsResponse {
  data?: MetaGraphPageAccount[];
}

async function graphFetch(
  path: string,
  init?: RequestInit & { searchParams?: Record<string, string> },
): Promise<Response> {
  const url = new URL(`${metaGraphApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`);
  if (init?.searchParams) {
    for (const [k, v] of Object.entries(init.searchParams)) {
      url.searchParams.set(k, v);
    }
  }
  const { searchParams: _sp, ...rest } = init ?? {};
  return fetch(url.toString(), rest);
}

export async function exchangeMetaOAuthCode(
  code: string,
  redirectUri: string,
): Promise<MetaOAuthTokenResponse> {
  const appSecret = getMetaAppSecret();
  if (!appSecret) {
    throw new Error('META_APP_SECRET not configured');
  }

  const res = await graphFetch('/oauth/access_token', {
    searchParams: {
      client_id: getMetaAppId(),
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Meta OAuth code exchange failed (${res.status}): ${body.slice(0, 200)}`);
  }

  return (await res.json()) as MetaOAuthTokenResponse;
}

export async function exchangeMetaLongLivedUserToken(
  shortLivedToken: string,
): Promise<MetaOAuthTokenResponse> {
  const appSecret = getMetaAppSecret();
  if (!appSecret) {
    throw new Error('META_APP_SECRET not configured');
  }

  const res = await graphFetch('/oauth/access_token', {
    searchParams: {
      grant_type: 'fb_exchange_token',
      client_id: getMetaAppId(),
      client_secret: appSecret,
      fb_exchange_token: shortLivedToken,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Meta long-lived token exchange failed (${res.status}): ${body.slice(0, 200)}`);
  }

  return (await res.json()) as MetaOAuthTokenResponse;
}

export async function fetchMetaUserId(userAccessToken: string): Promise<string> {
  const res = await graphFetch('/me', {
    searchParams: { access_token: userAccessToken, fields: 'id' },
  });
  if (!res.ok) {
    throw new Error(`Meta /me failed (${res.status})`);
  }
  const json = (await res.json()) as { id?: string };
  if (!json.id) throw new Error('Meta /me returned no id');
  return json.id;
}

export async function fetchMetaManagedPages(
  userAccessToken: string,
): Promise<MetaGraphPageAccount[]> {
  const res = await graphFetch('/me/accounts', {
    searchParams: {
      access_token: userAccessToken,
      fields: 'id,name,access_token',
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Meta page discovery failed (${res.status}): ${body.slice(0, 200)}`);
  }

  const json = (await res.json()) as MetaGraphAccountsResponse;
  return (json.data ?? []).filter((p) => p.id && p.access_token);
}

export async function subscribeMetaPageToLeadgen(
  pageId: string,
  pageAccessToken: string,
): Promise<void> {
  const res = await graphFetch(`/${pageId}/subscribed_apps`, {
    method: 'POST',
    searchParams: {
      access_token: pageAccessToken,
      subscribed_fields: metaLeadgenWebhookFields(),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Meta leadgen subscription failed (${res.status}): ${body.slice(0, 200)}`);
  }

  const json = (await res.json()) as { success?: boolean };
  if (json.success === false) {
    throw new Error('Meta leadgen subscription returned success=false');
  }
}

export function buildMetaOAuthAuthorizationUrl(input: {
  redirectUri: string;
  state: string;
}): string {
  const dialog = new URL(metaFacebookOAuthDialogUrl());
  dialog.searchParams.set('client_id', getMetaAppId());
  dialog.searchParams.set('redirect_uri', input.redirectUri);
  dialog.searchParams.set('state', input.state);
  dialog.searchParams.set('response_type', 'code');
  dialog.searchParams.set('scope', metaOAuthScopeString());
  return dialog.toString();
}
