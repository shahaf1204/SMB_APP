import {
  decryptIntegrationSecret,
  encryptIntegrationSecret,
} from '../../core/integrationSecrets.server';
import type { MetaGraphPageAccount } from './metaGraph.client';

export interface MetaOAuthPagesPayload {
  pages: Array<{ id: string; name: string; accessToken: string }>;
}

export function encryptMetaOAuthPagesPayload(pages: MetaGraphPageAccount[]): string {
  const payload: MetaOAuthPagesPayload = {
    pages: pages.map((p) => ({
      id: p.id,
      name: p.name,
      accessToken: p.access_token,
    })),
  };
  return encryptIntegrationSecret(JSON.stringify(payload));
}

export function decryptMetaOAuthPagesPayload(stored: string): MetaOAuthPagesPayload {
  if (!stored.trim()) {
    throw new Error('Meta OAuth pages payload cleared');
  }
  const json = decryptIntegrationSecret(stored);
  const parsed = JSON.parse(json) as MetaOAuthPagesPayload;
  if (!Array.isArray(parsed.pages)) {
    throw new Error('Invalid Meta OAuth pages payload');
  }
  return parsed;
}

export function toSafeMetaPageCandidates(payload: MetaOAuthPagesPayload): Array<{
  pageId: string;
  pageName: string;
}> {
  return payload.pages.map((p) => ({ pageId: p.id, pageName: p.name }));
}

export function resolvePageAccessToken(
  payload: MetaOAuthPagesPayload,
  pageId: string,
): { pageName: string; accessToken: string } | null {
  const page = payload.pages.find((p) => p.id === pageId);
  if (!page?.accessToken) return null;
  return { pageName: page.name, accessToken: page.accessToken };
}
