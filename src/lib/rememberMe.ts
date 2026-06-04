const REMEMBER_KEY = 'smb-remember-me';

export interface RememberMePrefs {
  displayName: string;
  email: string;
  enabled: boolean;
}

export function loadRememberMe(): RememberMePrefs | null {
  try {
    const raw = localStorage.getItem(REMEMBER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RememberMePrefs;
  } catch {
    return null;
  }
}

export function saveRememberMe(prefs: RememberMePrefs): void {
  try {
    localStorage.setItem(REMEMBER_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

export function clearRememberMe(): void {
  try {
    localStorage.removeItem(REMEMBER_KEY);
  } catch {
    /* ignore */
  }
}
