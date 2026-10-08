import { hydrateUserFromCloud } from './cloudSync';
import {
  isPasswordRecoveryPending,
  isPasswordRecoveryUrl,
  markPasswordRecoveryPending,
} from './passwordRecoveryFlow';
import { getSupabase, isSupabaseConfigured } from './supabase';
import { useAppStore } from '../store/useAppStore';

function sessionDisplayName(email: string, metadata?: Record<string, unknown>): string {
  const fromMeta = (metadata?.display_name as string | undefined)?.trim();
  return fromMeta || email.split('@')[0];
}

/** Apply recovery session from URL so updateUser({ password }) works — stay on /auth. */
export async function tryApplyPasswordRecoverySession(
  isAlive: () => boolean = () => true,
): Promise<boolean> {
  if (!isSupabaseConfigured() || !isPasswordRecoveryPending()) return false;

  markPasswordRecoveryPending();
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  if (!isAlive()) return false;
  const sessionUser = data.session?.user;
  if (!sessionUser?.email) return false;

  const email = sessionUser.email.toLowerCase();
  const displayName = sessionDisplayName(email, sessionUser.user_metadata);
  const current = useAppStore.getState().user;
  if (current?.email?.toLowerCase() === email && current.id === sessionUser.id) {
    return true;
  }

  if (!isAlive()) return false;
  await hydrateUserFromCloud(sessionUser.id, email, displayName);
  return true;
}

/** Restore Supabase auth session into the app store (stay signed in). */
export async function tryRestoreSupabaseSession(
  isAlive: () => boolean = () => true,
): Promise<boolean> {
  if (!isSupabaseConfigured() || isPasswordRecoveryPending()) return false;

  const supabase = getSupabase();
  let session = (await supabase.auth.getSession()).data.session;
  if (!isAlive()) return false;

  if (!session) {
    const refreshed = await supabase.auth.refreshSession();
    session = refreshed.data.session;
  }
  if (!isAlive()) return false;

  const sessionUser = session?.user;
  if (!sessionUser?.email) return false;

  const email = sessionUser.email.toLowerCase();
  const displayName = sessionDisplayName(email, sessionUser.user_metadata);
  const current = useAppStore.getState().user;

  if (current?.email?.toLowerCase() === email && current.id === sessionUser.id) {
    return true;
  }

  if (!isAlive()) return false;
  await hydrateUserFromCloud(sessionUser.id, email, displayName);
  return isAlive();
}

let authListenerRegistered = false;

/** Keep store in sync when Supabase refreshes or clears the session. */
export function registerSupabaseAuthListener(): void {
  if (!isSupabaseConfigured() || authListenerRegistered) return;
  authListenerRegistered = true;

  const supabase = getSupabase();
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') return;

    if (event === 'PASSWORD_RECOVERY') {
      markPasswordRecoveryPending();
    }

    if (
      session?.user?.email &&
      (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')
    ) {
      if (isPasswordRecoveryUrl()) {
        markPasswordRecoveryPending();
      }
      const email = session.user.email.toLowerCase();
      const displayName = sessionDisplayName(email, session.user.user_metadata);
      const current = useAppStore.getState().user;
      if (current?.email?.toLowerCase() !== email || current.id !== session.user.id) {
        try {
          const sessionUserId = session.user.id;
          await hydrateUserFromCloud(sessionUserId, email, displayName);
          const after = useAppStore.getState().user;
          if (after?.id !== sessionUserId) {
            console.warn('[auth] ignored late hydrate after account change');
          }
        } catch (e) {
          console.error('auth listener hydrate failed', e);
        }
      }
    }
  });
}
