import { findAccountSnapshot } from './accountArchive';
import { getAppSnapshot } from './appSnapshot';
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

export async function restoreSessionFromSupabase(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  if (hashParams.get('type') === 'recovery') {
    return false;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user.email) return false;

  const sessionUser = data.session.user;
  const email = sessionUser.email!.toLowerCase();
  const displayName =
    (sessionUser.user_metadata?.display_name as string | undefined)?.trim() ||
    email.split('@')[0];

  await hydrateUserFromCloud(sessionUser.id, email, displayName);
  return true;
}

export async function cloudSignOut(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await getSupabase().auth.signOut();
  setSyncStatus('idle');
}
