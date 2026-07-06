import { useEffect, useRef } from 'react';
import { registerExternalFormConnection } from '../lib/externalForms/clientApi';
import { processPendingExternalFormSubmissions } from '../lib/externalForms/syncPendingSubmissions';
import { patchExternalFormSyncStatus } from '../lib/externalForms/syncStatus';
import { useAppStore } from '../store/useAppStore';

/** Poll interval for pending Forms.app submissions (5–8s range). */
const POLL_MS = 6_000;

async function registerActiveConnections(businessId: string): Promise<void> {
  const connections = useAppStore
    .getState()
    .externalFormConnections.filter((c) => c.businessId === businessId && c.isActive);

  await Promise.all(
    connections.map((conn) => registerExternalFormConnection(conn).catch(() => undefined)),
  );
}

async function runExternalFormSync(businessId: string): Promise<void> {
  patchExternalFormSyncStatus({ syncing: true });

  try {
    await registerActiveConnections(businessId);

    const result = await processPendingExternalFormSubmissions(
      businessId,
      (params) => useAppStore.getState().processExternalFormSubmission(params),
    );

    const lastCreatedId =
      result.createdActivityIds[result.createdActivityIds.length - 1] ?? null;
    const lastEvent = lastCreatedId
      ? useAppStore.getState().events.find((e) => e.id === lastCreatedId)
      : undefined;

    patchExternalFormSyncStatus({
      syncing: false,
      lastSyncAt: new Date(),
      lastPendingCount: result.pendingCount,
      lastProcessedCount: result.processedCount,
      ...(lastCreatedId
        ? {
            lastCreatedActivityId: lastCreatedId,
            lastCreatedActivityTitle: lastEvent?.title ?? null,
          }
        : {}),
    });
  } catch {
    patchExternalFormSyncStatus({ syncing: false, lastSyncAt: new Date() });
  }
}

/**
 * Global background sync for real Forms.app webhook submissions.
 * Mounted from BusinessLayout — not tied to External Forms settings pages.
 * Uses only server-polled rawPayload; never generates mock data.
 */
export function useExternalFormSync(): void {
  const businessId = useAppStore((s) => s.business?.id);
  const activeConnectionCount = useAppStore(
    (s) =>
      s.externalFormConnections.filter((c) => c.businessId === s.business?.id && c.isActive)
        .length,
  );
  const syncingRef = useRef(false);

  useEffect(() => {
    if (!businessId) return;

    const sync = async () => {
      if (syncingRef.current) return;
      syncingRef.current = true;
      try {
        await runExternalFormSync(businessId);
      } finally {
        syncingRef.current = false;
      }
    };

    void sync();

    const interval = window.setInterval(() => void sync(), POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === 'visible') void sync();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [businessId, activeConnectionCount]);
}
