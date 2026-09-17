import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiAuthError, assertUserOwnsBusiness } from './apiAuth.server';

vi.mock('./supabase.server', () => ({
  getSupabaseAdminOptional: vi.fn(),
}));

import { getSupabaseAdminOptional } from './supabase.server';

function mockSupabase(handlers: {
  snapshot?: { business?: { id?: string } } | null;
  metaConnection?: boolean;
  crmLead?: boolean;
  snapshotRow?: boolean;
}) {
  vi.mocked(getSupabaseAdminOptional).mockReturnValue({
    from: (table: string) => {
      if (table === 'app_snapshots') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: handlers.snapshotRow
                  ? { user_id: 'u1' }
                  : handlers.snapshot !== undefined
                    ? { snapshot: handlers.snapshot }
                    : null,
              }),
            }),
          }),
        };
      }
      if (table === 'meta_connections') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                limit: () => ({
                  maybeSingle: async () => ({
                    data: handlers.metaConnection ? { id: 'mc-1' } : null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'crm_leads') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                limit: () => ({
                  maybeSingle: async () => ({
                    data: handlers.crmLead ? { id: 'lead-1' } : null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  } as never);
}

describe('assertUserOwnsBusiness', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('N. allows correct owner via app_snapshots', async () => {
    mockSupabase({ snapshot: { business: { id: 'biz-1' } } });
    await expect(assertUserOwnsBusiness('u1', 'biz-1')).resolves.toBeUndefined();
  });

  it('N. rejects wrong business in snapshot', async () => {
    mockSupabase({ snapshot: { business: { id: 'biz-other' } }, snapshotRow: true });
    await expect(assertUserOwnsBusiness('u1', 'biz-1')).rejects.toMatchObject({
      code: 'business_access_denied',
    });
  });

  it('N. rejects missing business with snapshot row present', async () => {
    mockSupabase({ snapshot: null, snapshotRow: true });
    await expect(assertUserOwnsBusiness('u1', 'biz-1')).rejects.toBeInstanceOf(ApiAuthError);
  });

  it('allows fallback via existing meta_connections row', async () => {
    mockSupabase({ snapshot: null, metaConnection: true, snapshotRow: true });
    await expect(assertUserOwnsBusiness('u1', 'biz-1')).resolves.toBeUndefined();
  });
});
