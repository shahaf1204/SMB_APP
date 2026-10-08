import { useEffect, useState } from 'react';
import { ensureAuthBootstrap } from '../lib/authBootstrap';
import { recordBootstrapOutcome } from '../lib/bootstrapDiagnostics';
import { useStoreHydration } from './useStoreHydration';

/** Never block the shell longer than this — auth/cloud may still finish in background. */
const BOOTSTRAP_UI_FAILSAFE_MS = 30_000;

/** Auto login — Supabase session or «זכור אותי» מקומי */
export function useAutoLoginFromRememberMe(): boolean {
  const hydrated = useStoreHydration();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hydrated) return;

    let cancelled = false;

    const markReady = () => {
      if (!cancelled) setReady(true);
    };

    const failsafe = window.setTimeout(() => {
      recordBootstrapOutcome('ui_bootstrap_failsafe');
      markReady();
    }, BOOTSTRAP_UI_FAILSAFE_MS);

    void ensureAuthBootstrap().finally(() => {
      window.clearTimeout(failsafe);
      markReady();
    });

    return () => {
      cancelled = true;
      window.clearTimeout(failsafe);
    };
  }, [hydrated]);

  return hydrated && ready;
}
