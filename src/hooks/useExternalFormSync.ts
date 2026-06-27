import { useEffect } from 'react';
import {
  acknowledgeExternalFormSubmissions,
  pollExternalFormSubmissions,
  registerExternalFormConnection,
} from '../lib/externalForms/clientApi';
import { useAppStore } from '../store/useAppStore';

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

    const sync = async () => {
      const pending = await pollExternalFormSubmissions(business.id);
      const ackIds: string[] = [];
      for (const item of pending) {
        const eventId = processExternalFormSubmission({
          connectionId: item.connectionId,
          rawPayload: item.rawPayload,
          externalSubmissionId: item.externalSubmissionId,
          submissionId: item.id,
        });
        if (eventId) ackIds.push(item.id);
      }
      if (ackIds.length) await acknowledgeExternalFormSubmissions(ackIds);
    };

    void sync();
    const interval = setInterval(() => void sync(), 45_000);
    return () => clearInterval(interval);
  }, [business?.id, processExternalFormSubmission]);
}
