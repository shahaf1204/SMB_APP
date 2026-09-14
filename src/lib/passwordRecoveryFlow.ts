const RECOVERY_FLAG_KEY = 'smb-password-recovery-pending';

/** Supabase recovery links put tokens in the URL hash (or ?code= for PKCE). */
export function isPasswordRecoveryUrl(): boolean {
  if (typeof window === 'undefined') return false;

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  if (hashParams.get('type') === 'recovery') return true;

  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.get('type') === 'recovery') return true;
  if (searchParams.get('recovery') === '1' || searchParams.get('recovery') === 'pending') {
    return true;
  }

  return false;
}

export function markPasswordRecoveryPending(): void {
  try {
    sessionStorage.setItem(RECOVERY_FLAG_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function clearPasswordRecoveryPending(): void {
  try {
    sessionStorage.removeItem(RECOVERY_FLAG_KEY);
  } catch {
    /* ignore */
  }
}

/** True while user must set a new password (recovery link or flag until save). */
export function isPasswordRecoveryPending(): boolean {
  if (isPasswordRecoveryUrl()) return true;
  try {
    return sessionStorage.getItem(RECOVERY_FLAG_KEY) === '1';
  } catch {
    return false;
  }
}
