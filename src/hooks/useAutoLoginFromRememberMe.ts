import { useEffect, useState } from 'react';
import { loadRememberMe } from '../lib/rememberMe';
import { useAppStore } from '../store/useAppStore';
import { useStoreHydration } from './useStoreHydration';

/** מנסה התחברות אוטומטית לפי «זכור אותי» אחרי טעינת localStorage */
export function useAutoLoginFromRememberMe(): boolean {
  const hydrated = useStoreHydration();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hydrated) return;

    const state = useAppStore.getState();
    if (state.user) {
      setReady(true);
      return;
    }

    const remembered = loadRememberMe();
    if (remembered?.enabled && remembered.email.trim()) {
      useAppStore.getState().loginExisting(remembered.email, remembered.displayName);
    }
    setReady(true);
  }, [hydrated]);

  return hydrated && ready;
}
