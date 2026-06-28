import { registerSupabaseAuthListener, tryRestoreSupabaseSession } from './authSession';
import { loadRememberMe } from './rememberMe';
import { isSupabaseConfigured } from './supabase';
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

  const state = useAppStore.getState();
  if (state.user?.email) return;

  if (isSupabaseConfigured()) {
    try {
      if (await tryRestoreSupabaseSession()) return;
    } catch (e) {
      console.error('session restore failed', e);
    }
  }

  const remembered = loadRememberMe();
  if (remembered?.enabled && remembered.email.trim() && !isSupabaseConfigured()) {
    useAppStore.getState().loginExisting(remembered.email, remembered.displayName);
  }
}
