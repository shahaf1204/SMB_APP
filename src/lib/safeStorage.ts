import type { StateStorage } from 'zustand/middleware';

export const STORAGE_KEY = 'smb-business-app';
export const STORAGE_QUOTA_EVENT = 'app-storage-quota';

/** localStorage עם הגנה מפני JSON פגום (גורם ל"טוען…" אינסופי) */
export const safeJsonStorage: StateStorage = {
  getItem: (name) => {
    try {
      const raw = localStorage.getItem(name);
      if (raw == null) return null;
      JSON.parse(raw);
      return raw;
    } catch (e) {
      console.warn('נתונים מקומיים פגומים — מנקה:', name, e);
      try {
        localStorage.removeItem(name);
      } catch {
        /* ignore */
      }
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        window.dispatchEvent(new CustomEvent(STORAGE_QUOTA_EVENT));
      }
      console.error('שמירה מקומית נכשלה:', e);
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};

export function clearAppStorage(): void {
  safeJsonStorage.removeItem(STORAGE_KEY);
}

/** איפוס לפי ?reset=1 בכתובת — לפני עליית React */
export function runBootstrapResetFromUrl(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset') !== '1') return false;
    clearAppStorage();
    const path = window.location.pathname || '/';
    window.history.replaceState({}, '', path);
    return true;
  } catch {
    return false;
  }
}
