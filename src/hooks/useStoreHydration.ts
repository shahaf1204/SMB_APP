import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';

const HYDRATION_TIMEOUT_MS = 800;

export function useStoreHydration(): boolean {
  const [hydrated, setHydrated] = useState(() => {
    try {
      return useAppStore.persist.hasHydrated();
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (useAppStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }

    const finish = () => setHydrated(true);
    const unsub = useAppStore.persist.onFinishHydration(finish);
    const timeout = window.setTimeout(finish, HYDRATION_TIMEOUT_MS);

    return () => {
      unsub();
      window.clearTimeout(timeout);
    };
  }, []);

  return hydrated;
}
