import { deploymentUrlFromEnv, getServerEnv } from './env.server';
import { getMetaGraphVersion } from './supabase.server';

/**
 * Meta API surface — see docs/meta-api-contract.md.
 * All Graph/OAuth URLs MUST derive from getMetaGraphVersion() (env META_GRAPH_VERSION, default v21.0).
 * Do not hardcode version strings elsewhere.
 */

/** Central Meta Graph API version (override via META_GRAPH_VERSION). */
export function metaGraphApiBaseUrl(): string {
  return `https://graph.facebook.com/${getMetaGraphVersion()}`;
}

export function metaFacebookOAuthDialogUrl(): string {
  return `https://www.facebook.com/${getMetaGraphVersion()}/dialog/oauth`;
}

export function getMetaAppId(): string {
  const id = getServerEnv('META_APP_ID') ?? getServerEnv('VITE_META_APP_ID');
  if (!id) {
    throw new Error('META_APP_ID is not configured');
  }
  return id;
}

export function getMetaOAuthRedirectUri(): string {
  const explicit = getServerEnv('META_OAUTH_REDIRECT_URI');
  if (explicit) return explicit;
  const base = deploymentUrlFromEnv();
  if (!base) {
    throw new Error('META_OAUTH_REDIRECT_URI or VERCEL_URL must be set for Meta OAuth callback');
  }
  return `${base.replace(/\/$/, '')}/api/integrations/meta/oauth/callback`;
}

/**
 * Scopes for Page leadgen connection (see Meta Login / App Review docs).
 * leads_retrieval + pages_manage_metadata typically require Advanced Access in production apps.
 */
export const META_OAUTH_SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'leads_retrieval',
  'pages_manage_metadata',
] as const;

export function metaOAuthScopeString(): string {
  return META_OAUTH_SCOPES.join(',');
}

export function metaOAuthTokenUrl(): string {
  return `${metaGraphApiBaseUrl()}/oauth/access_token`;
}

export function metaLeadgenWebhookFields(): string {
  return 'leadgen';
}
