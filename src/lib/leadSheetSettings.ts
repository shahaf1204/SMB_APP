const SETTINGS_KEY = 'smb-lead-sheet-sync';

export interface LeadSheetSettings {
  sheetInput: string;
  sheetId: string;
  gid: string;
  autoSync: boolean;
  lastSyncAt?: string;
  importedRowKeys: string[];
}

const DEFAULT: LeadSheetSettings = {
  sheetInput: '',
  sheetId: '',
  gid: '',
  autoSync: true,
  importedRowKeys: [],
};

export function extractGoogleSheetId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match?.[1] ?? null;
}

export function extractGoogleSheetGid(input: string): string {
  const match = input.match(/[?&#]gid=(\d+)/);
  return match?.[1] ?? '';
}

export function loadLeadSheetSettings(): LeadSheetSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT };
    const parsed = JSON.parse(raw) as Partial<LeadSheetSettings>;
    return {
      ...DEFAULT,
      ...parsed,
      importedRowKeys: Array.isArray(parsed.importedRowKeys) ? parsed.importedRowKeys : [],
    };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveLeadSheetSettings(settings: LeadSheetSettings): void {
  try {
    const trimmedKeys = settings.importedRowKeys.slice(-5000);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...settings, importedRowKeys: trimmedKeys }));
  } catch {
    /* ignore */
  }
}
