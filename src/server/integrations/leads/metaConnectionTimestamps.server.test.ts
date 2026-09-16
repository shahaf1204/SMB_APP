import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSupabaseAdminOptional } from '../../core/supabase.server';
import { touchMetaConnectionLastLeadReceived } from './metaConnectionTimestamps.server';

vi.mock('../../core/supabase.server', () => ({
  getSupabaseAdminOptional: vi.fn(),
}));

describe('touchMetaConnectionLastLeadReceived', () => {
  const connectionRows = new Map<string, Record<string, unknown>>();

  beforeEach(() => {
    connectionRows.clear();
    connectionRows.set('conn-a', { id: 'conn-a', last_lead_received_at: null });
    connectionRows.set('conn-b', { id: 'conn-b', last_lead_received_at: '2020-01-01T00:00:00.000Z' });

    vi.mocked(getSupabaseAdminOptional).mockReturnValue({
      from: (table: string) => {
        if (table !== 'meta_connections') {
          throw new Error(`unexpected table ${table}`);
        }
        return {
          update: (data: Record<string, unknown>) => ({
            eq: (_col: string, id: string) => {
              const row = connectionRows.get(id);
              if (row) connectionRows.set(id, { ...row, ...data });
              return Promise.resolve({ error: null });
            },
          }),
        };
      },
    } as never);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('updates last_lead_received_at for the target connection', async () => {
    const at = '2026-06-15T12:00:00.000Z';
    await touchMetaConnectionLastLeadReceived('conn-a', at);

    expect(connectionRows.get('conn-a')?.last_lead_received_at).toBe(at);
    expect(connectionRows.get('conn-a')?.updated_at).toBe(at);
  });

  it('does not update unrelated connections', async () => {
    await touchMetaConnectionLastLeadReceived('conn-a', '2026-06-15T12:00:00.000Z');
    expect(connectionRows.get('conn-b')?.last_lead_received_at).toBe('2020-01-01T00:00:00.000Z');
  });

  it('no-ops when Supabase admin is unavailable', async () => {
    vi.mocked(getSupabaseAdminOptional).mockReturnValue(null);
    await touchMetaConnectionLastLeadReceived('conn-a', '2026-06-15T12:00:00.000Z');
    expect(connectionRows.get('conn-a')?.last_lead_received_at).toBeNull();
  });
});
