import { useEffect, useState } from 'react';
import {
  getCloudSyncStatus,
  subscribeCloudSync,
} from '../lib/cloudSync';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

export function AutoSaveIndicator() {
  const business = useAppStore((s) => s.business);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [cloud, setCloud] = useState(getCloudSyncStatus());

  useEffect(() => {
    if (!business) return;

    const markSaved = () => setSavedAt(new Date());
    markSaved();

    const unsubStore = useAppStore.subscribe(markSaved);
    const unsubPersist = useAppStore.persist.onFinishHydration(markSaved);
    const unsubCloud = subscribeCloudSync(() => setCloud(getCloudSyncStatus()));

    return () => {
      unsubStore();
      unsubPersist();
      unsubCloud();
    };
  }, [business]);

  if (!business) return null;

  const cloudOn = isSupabaseConfigured();
  let label: string;

  if (cloudOn) {
    if (cloud.status === 'syncing') {
      label = 'שומר בענן…';
    } else if (cloud.status === 'error') {
      label = 'שגיאת שמירה בענן — יש גיבוי מקומי';
    } else if (cloud.lastSyncedAt) {
      label = `מגובה בענן ${cloud.lastSyncedAt.toLocaleTimeString('he-IL', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } else {
      label = 'מחובר לענן';
    }
  } else if (savedAt) {
    label = `נשמר במכשיר ${savedAt.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  } else {
    label = 'נשמר אוטומטית במכשיר';
  }

  return (
    <p className="auto-save-indicator" role="status">
      <span
        className={`auto-save-dot ${cloudOn && cloud.status === 'synced' ? 'auto-save-dot-cloud' : ''}`}
        aria-hidden
      />
      {label}
    </p>
  );
}
