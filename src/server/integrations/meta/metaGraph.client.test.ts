import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildMetaOAuthAuthorizationUrl,
  exchangeMetaOAuthCode,
  subscribeMetaPageToLeadgen,
} from './metaGraph.client';

vi.mock('../../core/supabase.server', () => ({
  getMetaAppSecret: vi.fn(() => 'secret'),
}));

vi.mock('../../core/meta.config.server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../core/meta.config.server')>();
  return {
    ...actual,
    getMetaAppId: () => 'app-123',
    metaGraphApiBaseUrl: () => 'https://graph.facebook.com/v21.0',
    metaFacebookOAuthDialogUrl: () => 'https://www.facebook.com/v21.0/dialog/oauth',
    metaOAuthScopeString: () => 'pages_show_list,leads_retrieval',
  };
});

describe('metaGraph.client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('builds OAuth authorization URL', () => {
    const url = buildMetaOAuthAuthorizationUrl({
      redirectUri: 'https://app/callback',
      state: 'state-token',
    });
    expect(url).toContain('client_id=app-123');
    expect(url).toContain('state=state-token');
    expect(url).toContain('pages_show_list');
  });

  it('exchanges OAuth code via Graph', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ access_token: 'user-token' }),
      })),
    );

    const token = await exchangeMetaOAuthCode('auth-code', 'https://app/callback');
    expect(token.access_token).toBe('user-token');
    const calledUrl = vi.mocked(fetch).mock.calls[0]?.[0] as string;
    expect(calledUrl).toContain('/oauth/access_token');
    expect(calledUrl).toContain('client_secret=secret');
  });

  it('subscribes page to leadgen', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ success: true }),
      })),
    );

    await subscribeMetaPageToLeadgen('page-9', 'page-token');
    const calledUrl = vi.mocked(fetch).mock.calls[0]?.[0] as string;
    expect(calledUrl).toContain('/page-9/subscribed_apps');
    expect(calledUrl).toContain('leadgen');
  });
});
