import { useEffect, useMemo } from 'react';
import { syncProvider } from '../lib/integrations/client';
import { useAppStore } from '../store/useAppStore';

const AUTO_SYNC_MS = 15 * 60 * 1000;

export function useIntegrationSync(): void {
  const business = useAppStore((s) => s.business);
  const connections = useAppStore((s) => s.integrationConnections);
  const updateIntegrationSync = useAppStore((s) => s.updateIntegrationSync);

  const activeKey = useMemo(() => {
    return connections
      .filter((c) => c.businessId === business?.id && c.connectionStatus === 'connected')
      .map((c) => `${c.id}:${c.provider}`)
      .sort()
      .join(',');
  }, [connections, business?.id]);

  useEffect(() => {
    if (!business?.id || !activeKey) return;

    const runSync = async () => {
      const active = useAppStore
        .getState()
        .integrationConnections.filter(
          (c) => c.businessId === business.id && c.connectionStatus === 'connected',
        );

      for (const conn of active) {
        updateIntegrationSync(conn.id, { syncStatus: 'syncing' });
        try {
          const result = await syncProvider({
            connectionId: conn.id,
            businessId: business.id,
            provider: conn.provider,
          });
          updateIntegrationSync(conn.id, {
            syncStatus: result.ok ? 'success' : 'error',
            lastSync: result.syncedAt,
            nextSync: new Date(Date.now() + AUTO_SYNC_MS).toISOString(),
            lastError: result.error,
            connectionStatus: result.ok ? 'connected' : 'error',
          });
        } catch (e) {
          updateIntegrationSync(conn.id, {
            syncStatus: 'error',
            lastError: e instanceof Error ? e.message : 'Sync failed',
            connectionStatus: 'error',
          });
        }
      }
    };

    void runSync();
    const interval = setInterval(() => void runSync(), AUTO_SYNC_MS);
    return () => clearInterval(interval);
  }, [business?.id, activeKey, updateIntegrationSync]);
}
