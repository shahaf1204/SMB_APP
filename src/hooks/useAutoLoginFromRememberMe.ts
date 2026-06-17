import { useEffect, useState } from 'react';
import { restoreSessionFromSupabase } from '../lib/cloudSync';
import { isSupabaseConfigured } from '../lib/supabase';
import { loadRememberMe } from '../lib/rememberMe';
import { useAppStore } from '../store/useAppStore';
import { useStoreHydration } from './useStoreHydration';

/** התחברות אוטומטית — Supabase session או «זכור אותי» מקומי */
export function useAutoLoginFromRememberMe(): boolean {
  const hydrated = useStoreHydration();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hydrated) return;

    let cancelled = false;

    void (async () => {
      const state = useAppStore.getState();
      if (state.user) {
        if (!cancelled) setReady(true);
        return;
      }

      if (isSupabaseConfigured()) {
        try {
          const restored = await restoreSessionFromSupabase();
          if (restored) {
            if (!cancelled) setReady(true);
            return;
          }
        } catch (e) {
          console.error('session restore failed', e);
        }
      }

      const remembered = loadRememberMe();
      if (remembered?.enabled && remembered.email.trim() && !isSupabaseConfigured()) {
        useAppStore.getState().loginExisting(remembered.email, remembered.displayName);
      }
      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated]);

  return hydrated && ready;
}
