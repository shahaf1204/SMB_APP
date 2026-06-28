import { hydrateUserFromCloud } from './cloudSync';
import { getSupabase, isSupabaseConfigured } from './supabase';
import { useAppStore } from '../store/useAppStore';

function isPasswordRecoveryUrl(): boolean {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return hashParams.get('type') === 'recovery';
}

function sessionDisplayName(email: string, metadata?: Record<string, unknown>): string {
  const fromMeta = (metadata?.display_name as string | undefined)?.trim();
  return fromMeta || email.split('@')[0];
}

/** Restore Supabase auth session into the app store (stay signed in). */
export async function tryRestoreSupabaseSession(): Promise<boolean> {
  if (!isSupabaseConfigured() || isPasswordRecoveryUrl()) return false;

  const supabase = getSupabase();
  let session = (await supabase.auth.getSession()).data.session;

  if (!session) {
    const refreshed = await supabase.auth.refreshSession();
    session = refreshed.data.session;
  }

  const sessionUser = session?.user;
  if (!sessionUser?.email) return false;

  const email = sessionUser.email.toLowerCase();
  const displayName = sessionDisplayName(email, sessionUser.user_metadata);
  const current = useAppStore.getState().user;

  if (current?.email?.toLowerCase() === email && current.id === sessionUser.id) {
    return true;
  }

  await hydrateUserFromCloud(sessionUser.id, email, displayName);
  return true;
}

let authListenerRegistered = false;

/** Keep store in sync when Supabase refreshes or clears the session. */
export function registerSupabaseAuthListener(): void {
  if (!isSupabaseConfigured() || authListenerRegistered) return;
  authListenerRegistered = true;

  const supabase = getSupabase();
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') return;

    if (
      session?.user?.email &&
      (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')
    ) {
      const email = session.user.email.toLowerCase();
      const displayName = sessionDisplayName(email, session.user.user_metadata);
      const current = useAppStore.getState().user;
      if (current?.email?.toLowerCase() !== email || current.id !== session.user.id) {
        try {
          await hydrateUserFromCloud(session.user.id, email, displayName);
        } catch (e) {
          console.error('auth listener hydrate failed', e);
        }
      }
    }
  });
}
