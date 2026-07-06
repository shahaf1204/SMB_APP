export interface ExternalFormSyncStatus {
  syncing: boolean;
  lastSyncAt: Date | null;
  lastPendingCount: number;
  lastProcessedCount: number;
  lastCreatedActivityId: string | null;
  lastCreatedActivityTitle: string | null;
}

const defaultStatus: ExternalFormSyncStatus = {
  syncing: false,
  lastSyncAt: null,
  lastPendingCount: 0,
  lastProcessedCount: 0,
  lastCreatedActivityId: null,
  lastCreatedActivityTitle: null,
};

let status: ExternalFormSyncStatus = { ...defaultStatus };
const listeners = new Set<() => void>();

function emit(): void {
  for (const fn of listeners) fn();
}

export function getExternalFormSyncStatus(): ExternalFormSyncStatus {
  return status;
}

export function subscribeExternalFormSync(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function patchExternalFormSyncStatus(
  patch: Partial<ExternalFormSyncStatus>,
): void {
  status = { ...status, ...patch };
  emit();
}

export function resetExternalFormSyncStatus(): void {
  status = { ...defaultStatus };
  emit();
}
