import { useEffect, useState } from 'react';
import {
  getExternalFormSyncStatus,
  subscribeExternalFormSync,
} from '../../lib/externalForms/syncStatus';
import { useAppStore } from '../../store/useAppStore';

export function ExternalFormSyncIndicator() {
  const business = useAppStore((s) => s.business);
  const activeForms = useAppStore(
    (s) =>
      s.externalFormConnections.filter((c) => c.businessId === s.business?.id && c.isActive)
        .length,
  );
  const [status, setStatus] = useState(getExternalFormSyncStatus());

  useEffect(() => {
    setStatus(getExternalFormSyncStatus());
    return subscribeExternalFormSync(() => setStatus(getExternalFormSyncStatus()));
  }, []);

  if (!business || activeForms === 0) return null;

  const syncLabel = status.lastSyncAt
    ? status.lastSyncAt.toLocaleTimeString('he-IL', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '—';

  const activityLabel = status.lastCreatedActivityTitle
    ? status.lastCreatedActivityTitle
    : status.lastCreatedActivityId
      ? status.lastCreatedActivityId.slice(0, 8)
      : '—';

  return (
    <p className="external-form-sync-indicator" role="status" aria-live="polite">
      <span
        className={`external-form-sync-dot ${status.syncing ? 'external-form-sync-dot--busy' : ''}`}
        aria-hidden
      />
      טפסים: סנכרון {status.syncing ? '…' : syncLabel}
      {' · '}
      בתור: {status.lastPendingCount}
      {' · '}
      נוצרו: {status.lastProcessedCount}
      {' · '}
      אחרון: {activityLabel}
    </p>
  );
}
