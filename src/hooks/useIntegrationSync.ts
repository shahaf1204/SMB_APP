import { useEffect, useMemo } from 'react';
import { syncProvider } from '../lib/integrations/client';
import { normalizeIntegrationConnection } from '../types/integrations';
import { useAppStore } from '../store/useAppStore';

const AUTO_SYNC_MS = 15 * 60 * 1000;

function isActiveConnection(c: ReturnType<typeof normalizeIntegrationConnection>): boolean {
  return c.status === 'connected' || c.status === 'mock' || c.status === 'sandbox';
}

export function useIntegrationSync(): void {
  const business = useAppStore((s) => s.business);
  const connections = useAppStore((s) => s.integrationConnections);
  const updateIntegrationSync = useAppStore((s) => s.updateIntegrationSync);

  const activeKey = useMemo(() => {
    return connections
      .map((c) => normalizeIntegrationConnection(c as never))
      .filter((c) => c.businessId === business?.id && isActiveConnection(c))
      .map((c) => `${c.id}:${c.providerId}`)
      .sort()
      .join(',');
  }, [connections, business?.id]);

  useEffect(() => {
    if (!business?.id || !activeKey) return;

    const runSync = async () => {
      const active = useAppStore
        .getState()
        .integrationConnections.map((c) => normalizeIntegrationConnection(c as never))
        .filter((c) => c.businessId === business.id && isActiveConnection(c));

      for (const conn of active) {
        updateIntegrationSync(conn.id, { syncStatus: 'syncing' });
        try {
          const result = await syncProvider({
            connectionId: conn.id,
            businessId: business.id,
            provider: conn.providerId,
          });
          updateIntegrationSync(conn.id, {
            syncStatus: result.ok ? 'success' : 'error',
            lastSyncAt: result.syncedAt,
            nextSync: new Date(Date.now() + AUTO_SYNC_MS).toISOString(),
            lastError: result.error,
            status: result.ok ? 'connected' : 'error',
          });
        } catch (e) {
          updateIntegrationSync(conn.id, {
            syncStatus: 'error',
            lastError: e instanceof Error ? e.message : 'Sync failed',
            status: 'error',
          });
        }
      }
    };

    void runSync();
    const interval = setInterval(() => void runSync(), AUTO_SYNC_MS);
    return () => clearInterval(interval);
  }, [business?.id, activeKey, updateIntegrationSync]);
}
