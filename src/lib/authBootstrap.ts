import {
  registerSupabaseAuthListener,
  tryApplyPasswordRecoverySession,
  tryRestoreSupabaseSession,
} from './authSession';
import { isPasswordRecoveryPending } from './passwordRecoveryFlow';
import { loadRememberMe } from './rememberMe';
import { getSupabase, isSupabaseConfigured } from './supabase';
import { useAppStore } from '../store/useAppStore';

let bootstrapPromise: Promise<void> | null = null;

/** Single auth bootstrap — session restore or local «זכור אותי». */
export function ensureAuthBootstrap(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = runAuthBootstrap();
  }
  return bootstrapPromise;
}

async function runAuthBootstrap(): Promise<void> {
  registerSupabaseAuthListener();

  if (isSupabaseConfigured()) {
    try {
      if (isPasswordRecoveryPending()) {
        await tryApplyPasswordRecoverySession();
        return;
      }
      if (await tryRestoreSupabaseSession()) return;

      const { data } = await getSupabase().auth.getSession();
      if (!data.session && useAppStore.getState().user) {
        useAppStore.getState().logout();
      }
    } catch (e) {
      console.error('session restore failed', e);
    }
  }

  const remembered = loadRememberMe();
  if (remembered?.enabled && remembered.email.trim() && !isSupabaseConfigured()) {
    useAppStore.getState().loginExisting(remembered.email, remembered.displayName);
  }
}
