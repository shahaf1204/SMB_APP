import { useEffect, useState } from 'react';
import { ensureAuthBootstrap } from '../lib/authBootstrap';
import { useStoreHydration } from './useStoreHydration';

/** Auto login — Supabase session or «זכור אותי» מקומי */
export function useAutoLoginFromRememberMe(): boolean {
  const hydrated = useStoreHydration();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hydrated) return;

    let cancelled = false;

    void ensureAuthBootstrap().finally(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [hydrated]);

  return hydrated && ready;
}
