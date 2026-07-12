import { findAccountSnapshot } from './accountArchive';
import { getAppSnapshot } from './appSnapshot';
import { buildFormActivityNotificationFromEvent } from './externalForms/formActivityNotification';
import { getClientName } from './events';
import { createId } from './ids';
import { EXTERNAL_FORM_PROVIDER_LABELS } from '../types/externalForms';
import { getSupabase, isSupabaseConfigured } from './supabase';
import { useAppStore } from '../store/useAppStore';
import type { AppState } from '../types/models';

export type CloudSyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

let syncStatus: CloudSyncStatus = isSupabaseConfigured() ? 'idle' : 'offline';
let syncError: string | null = null;
let lastSyncedAt: Date | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function getCloudSyncStatus(): {
  status: CloudSyncStatus;
  error: string | null;
  lastSyncedAt: Date | null;
} {
  return { status: syncStatus, error: syncError, lastSyncedAt };
}

export function subscribeCloudSync(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setSyncStatus(status: CloudSyncStatus, error: string | null = null) {
  syncStatus = status;
  syncError = error;
  if (status === 'synced') lastSyncedAt = new Date();
  notify();
}

export interface CloudSnapshotRow {
  snapshot: AppState;
  updated_at: string;
  display_name: string;
}

export async function pullCloudSnapshot(userId: string): Promise<CloudSnapshotRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('app_snapshots')
    .select('snapshot, updated_at, display_name')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('cloud pull failed', error);
    throw new Error('לא הצלחנו לטעון נתונים מהענן');
  }
  if (!data) return null;
  return data as CloudSnapshotRow;
}

export async function pushCloudSnapshot(
  userId: string,
  displayName: string,
  snapshot?: AppState,
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabase();
  const payload = snapshot ?? getAppSnapshot();
  const { error } = await supabase.from('app_snapshots').upsert({
    user_id: userId,
    display_name: displayName,
    snapshot: payload,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error('cloud push failed', error);
    throw new Error('לא הצלחנו לשמור בענן');
  }
}

function snapshotHasData(state: AppState): boolean {
  return Boolean(
    state.business ||
      state.events.length > 0 ||
      state.leads.length > 0 ||
      state.invoices.length > 0 ||
      (state.engagements?.length ?? 0) > 0,
  );
}

/** טעינה מהענן אחרי התחברות — עם העלאת נתונים מקומיים ישנים אם הענן ריק */
export async function hydrateUserFromCloud(
  userId: string,
  email: string,
  displayName: string,
): Promise<'cloud' | 'migrated' | 'new'> {
  if (!isSupabaseConfigured()) return 'new';

  setSyncStatus('syncing');
  try {
    const cloud = await pullCloudSnapshot(userId);

    if (cloud?.snapshot && snapshotHasData(cloud.snapshot)) {
      useAppStore.getState().restoreAppState({
        ...cloud.snapshot,
        user: { id: userId, displayName, email },
      });
      setSyncStatus('synced');
      return 'cloud';
    }

    const archived = findAccountSnapshot(displayName, email);
    if (archived && snapshotHasData(archived as AppState)) {
      useAppStore.getState().restoreAppState({
        ...archived,
        user: { id: userId, displayName, email },
      });
      await pushCloudSnapshot(userId, displayName);
      setSyncStatus('synced');
      return 'migrated';
    }

    const local = getAppSnapshot();
    if (snapshotHasData(local) && local.user?.email?.toLowerCase() === email.toLowerCase()) {
      useAppStore.setState({ user: { id: userId, displayName, email } });
      await pushCloudSnapshot(userId, displayName);
      setSyncStatus('synced');
      return 'migrated';
    }

    useAppStore.setState({
      user: { id: userId, displayName, email },
    });
    await pushCloudSnapshot(userId, displayName, {
      ...useAppStore.getState(),
      user: { id: userId, displayName, email },
    });
    setSyncStatus('synced');
    return 'new';
  } catch (e) {
    setSyncStatus('error', e instanceof Error ? e.message : 'שגיאת סנכרון');
    throw e;
  }
}

let pushTimer: ReturnType<typeof setTimeout> | undefined;
let pushInFlight = false;

export function scheduleCloudPush(): void {
  if (!isSupabaseConfigured()) return;
  const { user } = useAppStore.getState();
  if (!user?.email) return;

  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    void flushCloudPush();
  }, 1200);
}

export async function flushCloudPush(): Promise<void> {
  if (!isSupabaseConfigured() || pushInFlight) return;
  const { user } = useAppStore.getState();
  if (!user?.email) return;

  pushInFlight = true;
  setSyncStatus('syncing');
  try {
    await pushCloudSnapshot(user.id, user.displayName);
    setSyncStatus('synced');
  } catch (e) {
    setSyncStatus('error', e instanceof Error ? e.message : 'שגיאת שמירה');
  } finally {
    pushInFlight = false;
  }
}

export async function refreshFromCloudIfNewer(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const user = useAppStore.getState().user;
  if (!user?.id) return false;

  try {
    const cloud = await pullCloudSnapshot(user.id);
    if (!cloud?.snapshot) return false;

    const local = useAppStore.getState();
    const cloudSnapshot = cloud.snapshot;
    const cloudEvents = cloudSnapshot.events ?? [];
    const localEventIds = new Set(local.events.map((e) => e.id));
    const newExternalEvents = cloudEvents.filter(
      (e) => e.source === 'external_form' && !localEventIds.has(e.id),
    );

    if (newExternalEvents.length > 0) {
      const newEventIds = new Set(newExternalEvents.map((e) => e.id));
      const cloudValues = (cloudSnapshot.eventValues ?? []).filter((v) =>
        newEventIds.has(v.eventId),
      );
      const cloudLeadIds = new Set(
        (cloudSnapshot.leads ?? [])
          .filter((l) => newExternalEvents.some((e) => e.clientPhone === l.phone || e.title.includes(l.name)))
          .map((l) => l.id),
      );
      const newLeads = (cloudSnapshot.leads ?? []).filter(
        (l) => cloudLeadIds.has(l.id) && !local.leads.some((x) => x.id === l.id),
      );
      const newNotifications = (cloudSnapshot.formNotifications ?? []).filter(
        (n) => n.activityId && newEventIds.has(n.activityId),
      );
      const notifiedIds = new Set(newNotifications.map((n) => n.activityId));
      const categories = cloudSnapshot.categories ?? local.categories;
      const synthesized = newExternalEvents
        .filter((ev) => !notifiedIds.has(ev.id))
        .map((ev) => {
          const conn = local.externalFormConnections.find(
            (c) => c.id === ev.externalFormConnectionId,
          );
          const provider = ev.externalFormProvider as keyof typeof EXTERNAL_FORM_PROVIDER_LABELS;
          const sourceLabel =
            provider && provider in EXTERNAL_FORM_PROVIDER_LABELS
              ? EXTERNAL_FORM_PROVIDER_LABELS[provider]
              : 'טופס';
          const clientName =
            getClientName(ev.id, categories, cloudValues) ?? ev.title ?? 'לקוח';
          return buildFormActivityNotificationFromEvent({
            id: createId(),
            connectionId: ev.externalFormConnectionId ?? conn?.id ?? '',
            formName: conn?.formName ?? 'טופס',
            sourceLabel,
            activityId: ev.id,
            clientName,
            clientPhone: ev.clientPhone,
            location: ev.location,
            createdAt: new Date().toISOString(),
          });
        });

      useAppStore.setState({
        events: [...newExternalEvents, ...local.events],
        eventValues: [...cloudValues, ...local.eventValues],
        leads: [...newLeads, ...local.leads],
        formNotifications: [...synthesized, ...newNotifications, ...local.formNotifications].slice(
          0,
          20,
        ),
      });
      setSyncStatus('synced');
      return true;
    }

    const cloudMs = new Date(cloud.updated_at).getTime();
    const localMs = lastSyncedAt?.getTime() ?? 0;
    if (cloudMs <= localMs) return false;

    useAppStore.getState().restoreAppState({
      ...cloud.snapshot,
      user,
    });
    setSyncStatus('synced');
    return true;
  } catch (e) {
    console.error('cloud refresh failed', e);
    return false;
  }
}

export async function cloudSignOut(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await getSupabase().auth.signOut();
  setSyncStatus('idle');
}
