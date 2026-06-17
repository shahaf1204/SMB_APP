import { useEffect } from 'react';
import { scheduleCloudPush } from '../lib/cloudSync';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

/** דוחף שינויים לענן אחרי כל עדכון ב-store */
export function useCloudSync(): void {
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const unsub = useAppStore.subscribe(() => {
      const { user } = useAppStore.getState();
      if (!user?.email) return;
      scheduleCloudPush();
    });

    return unsub;
  }, []);
}
