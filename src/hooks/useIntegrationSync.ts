import { useEffect, useMemo } from 'react';
import { syncProvider } from '../lib/integrations/client';
import { useAppStore } from '../store/useAppStore';

const AUTO_SYNC_MS = 15 * 60 * 1000;

export function useIntegrationSync(): void {
  const business = useAppStore((s) => s.business);
  const connections = useAppStore((s) => s.integrationConnections);
  const updateIntegrationSync = useAppStore((s) => s.updateIntegrationSync);

  const activeIds = useMemo(
    () =>
      connections
        .filter((c) => c.businessId === business?.id && c.connectionStatus === 'connected')
        .map((c) => c.id)
        .sort()
        .join(','),
    [connections, business?.id],
  );

  useEffect(() => {
    if (!business?.id || !activeIds) return;

    const ids = activeIds.split(',');

    const runSync = async () => {
      for (const connectionId of ids) {
        updateIntegrationSync(connectionId, { syncStatus: 'syncing' });
        try {
          const result = await syncProvider({
            connectionId,
            businessId: business.id,
          });
          updateIntegrationSync(connectionId, {
            syncStatus: result.ok ? 'success' : 'error',
            lastSync: result.syncedAt,
            nextSync: new Date(Date.now() + AUTO_SYNC_MS).toISOString(),
            lastError: result.error,
            connectionStatus: result.ok ? 'connected' : 'error',
          });
        } catch (e) {
          updateIntegrationSync(connectionId, {
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
  }, [business?.id, activeIds, updateIntegrationSync]);
}
