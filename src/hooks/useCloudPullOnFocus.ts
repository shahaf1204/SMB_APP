import { useEffect } from 'react';
import { refreshFromCloudIfNewer } from '../lib/cloudSync';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

/** Pull app_snapshots from Supabase when app loads or tab becomes visible (no form polling). */
export function useCloudPullOnFocus(): void {
  const userId = useAppStore((s) => s.user?.id);

  useEffect(() => {
    if (!userId || !isSupabaseConfigured()) return;

    const pull = () => {
      if (document.visibilityState === 'visible') void refreshFromCloudIfNewer();
    };

    void refreshFromCloudIfNewer();
    document.addEventListener('visibilitychange', pull);
    const interval = window.setInterval(() => void refreshFromCloudIfNewer(), 30_000);

    return () => {
      document.removeEventListener('visibilitychange', pull);
      window.clearInterval(interval);
    };
  }, [userId]);
}
