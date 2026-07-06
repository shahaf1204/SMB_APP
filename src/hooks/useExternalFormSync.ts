import { useEffect } from 'react';
import {
  registerExternalFormConnection,
} from '../lib/externalForms/clientApi';
import { processPendingExternalFormSubmissions } from '../lib/externalForms/syncPendingSubmissions';
import { useAppStore } from '../store/useAppStore';

const POLL_MS = 8_000;

export function useExternalFormSync(): void {
  const business = useAppStore((s) => s.business);
  const connections = useAppStore((s) => s.externalFormConnections);
  const processExternalFormSubmission = useAppStore((s) => s.processExternalFormSubmission);

  useEffect(() => {
    if (!business?.id) return;

    const active = connections.filter((c) => c.businessId === business.id && c.isActive);
    for (const conn of active) {
      void registerExternalFormConnection(conn).catch(() => undefined);
    }
  }, [business?.id, connections]);

  useEffect(() => {
    if (!business?.id) return;

    const sync = () =>
      processPendingExternalFormSubmissions(business.id, processExternalFormSubmission);

    void sync();
    const interval = setInterval(() => void sync(), POLL_MS);
    return () => clearInterval(interval);
  }, [business?.id, processExternalFormSubmission]);
}
