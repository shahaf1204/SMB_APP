import { normalizeLeads } from './crm/leadNormalize';
import type { AppState, Lead } from '../types/models';

const BACKUP_VERSION = 1;

export interface BackupPayload {
  version: number;
  exportedAt: string;
  data: AppState;
}

export function exportBackup(state: AppState): string {
  const payload: BackupPayload = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: state,
  };
  return JSON.stringify(payload, null, 2);
}

export function downloadBackup(state: AppState, businessName: string): void {
  const json = exportBackup(state);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `גיבוי-${businessName}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export type ImportResult =
  | { ok: true; data: AppState }
  | { ok: false; error: string };

export function parseBackup(jsonText: string): ImportResult {
  try {
    const parsed = JSON.parse(jsonText) as BackupPayload | AppState;
    const data =
      'data' in parsed && parsed.data && typeof parsed === 'object'
        ? (parsed as BackupPayload).data
        : (parsed as AppState);
    if (!data.user && !data.business) {
      return { ok: false, error: 'קובץ הגיבוי ריק או לא תקין' };
    }
    return {
      ok: true,
      data: {
        ...data,
        eventTemplates: data.eventTemplates ?? [],
        tasks: data.tasks ?? [],
        dismissedAutoTasks: data.dismissedAutoTasks ?? [],
        leads: normalizeLeads(data.leads as Lead[]),
        invoices: data.invoices ?? [],
        nextInvoiceNumber: data.nextInvoiceNumber ?? 1001,
      },
    };
  } catch {
    return { ok: false, error: 'לא ניתן לקרוא את הקובץ' };
  }
}
