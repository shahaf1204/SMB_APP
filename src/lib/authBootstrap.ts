import {
  registerSupabaseAuthListener,
  tryApplyPasswordRecoverySession,
  tryRestoreSupabaseSession,
} from './authSession';
import { withTimeout } from './asyncTimeout';
import { recordBootstrapOutcome, setBootstrapPhase } from './bootstrapDiagnostics';
import { invalidateCloudOperations } from './cloudSync';
import { isPasswordRecoveryPending } from './passwordRecoveryFlow';
import { loadRememberMe } from './rememberMe';
import { getSupabase, isSupabaseConfigured } from './supabase';
import { useAppStore } from '../store/useAppStore';

const AUTH_BOOTSTRAP_TIMEOUT_MS = 28_000;

let bootstrapPromise: Promise<void> | null = null;
let authBootstrapGeneration = 0;

/** Single auth bootstrap — session restore or local «זכור אותי». */
export function ensureAuthBootstrap(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = runAuthBootstrap();
  }
  return bootstrapPromise;
}

async function runSupabaseAuthBootstrap(generation: number): Promise<void> {
  const alive = () => generation === authBootstrapGeneration;

  if (isPasswordRecoveryPending()) {
    setBootstrapPhase('password_recovery');
    if (!alive()) return;
    await tryApplyPasswordRecoverySession(alive);
    return;
  }

  setBootstrapPhase('session_restore');
  if (!alive()) return;
  if (await tryRestoreSupabaseSession(alive)) return;

  if (!alive()) return;
  const { data } = await getSupabase().auth.getSession();
  if (!data.session && useAppStore.getState().user) {
    useAppStore.getState().logout();
  }
}

async function runAuthBootstrap(): Promise<void> {
  const generation = ++authBootstrapGeneration;
  setBootstrapPhase('auth_bootstrap');
  registerSupabaseAuthListener();

  if (isSupabaseConfigured()) {
    try {
      await withTimeout(
        runSupabaseAuthBootstrap(generation),
        AUTH_BOOTSTRAP_TIMEOUT_MS,
        'auth_bootstrap',
      );
    } catch (e) {
      console.error('session restore failed or timed out', e);
      authBootstrapGeneration += 1;
      invalidateCloudOperations();
      recordBootstrapOutcome('auth_bootstrap_timeout');
    }
  }

  const remembered = loadRememberMe();
  if (remembered?.enabled && remembered.email.trim() && !isSupabaseConfigured()) {
    useAppStore.getState().loginExisting(remembered.email, remembered.displayName);
  }

  recordBootstrapOutcome('auth_bootstrap_complete');
}
