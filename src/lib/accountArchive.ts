import { normalizeLeads } from './crm/leadNormalize';
import type { AppState, Lead } from '../types/models';

const ARCHIVE_PREFIX = 'smb-account-';

export function accountKey(displayName: string, email?: string): string | null {
  const mail = email?.trim().toLowerCase();
  if (mail) return `email:${mail}`;
  const name = displayName.trim();
  if (name.length >= 2) return `name:${name.toLowerCase().replace(/\s+/g, '-')}`;
  return null;
}

/** כל המפתחות האפשריים לאותו משתמש — מונע איבוד כשמתחברים פעם עם שם ופעם עם אימייל */
export function accountKeysForUser(displayName: string, email?: string): string[] {
  const keys = new Set<string>();
  const mail = email?.trim().toLowerCase();
  const name = displayName.trim();
  if (mail) keys.add(`email:${mail}`);
  if (name.length >= 2) keys.add(`name:${name.toLowerCase().replace(/\s+/g, '-')}`);
  return [...keys];
}

export type AccountSnapshot = Omit<AppState, 'user'> & {
  user: AppState['user'];
};

export function snapshotFromState(state: AppState): AccountSnapshot {
  return {
    user: state.user,
    business: state.business,
    categories: state.categories,
    events: state.events,
    eventValues: state.eventValues,
    leads: state.leads,
    invoices: state.invoices,
    nextInvoiceNumber: state.nextInvoiceNumber,
    eventTemplates: state.eventTemplates,
    tasks: state.tasks,
    dismissedAutoTasks: state.dismissedAutoTasks,
    engagements: state.engagements,
    milestones: state.milestones,
    engagementSessions: state.engagementSessions,
    integrationConnections: state.integrationConnections,
    externalFormConnections: state.externalFormConnections,
    externalFormSubmissions: state.externalFormSubmissions,
    formNotifications: state.formNotifications,
    monthlyExpenses: state.monthlyExpenses ?? [],
  };
}

function normalizeSnapshot(data: AccountSnapshot): AccountSnapshot {
  return {
    ...data,
    events: Array.isArray(data.events) ? data.events : [],
    eventValues: Array.isArray(data.eventValues) ? data.eventValues : [],
    categories: Array.isArray(data.categories) ? data.categories : [],
    leads: Array.isArray(data.leads) ? normalizeLeads(data.leads as Lead[]) : [],
    invoices: Array.isArray(data.invoices) ? data.invoices : [],
    eventTemplates: Array.isArray(data.eventTemplates) ? data.eventTemplates : [],
    tasks: Array.isArray(data.tasks) ? data.tasks : [],
    dismissedAutoTasks: Array.isArray(data.dismissedAutoTasks)
      ? data.dismissedAutoTasks
      : [],
    engagements: Array.isArray(data.engagements) ? data.engagements : [],
    milestones: Array.isArray(data.milestones) ? data.milestones : [],
    engagementSessions: Array.isArray(data.engagementSessions)
      ? data.engagementSessions
      : [],
    integrationConnections: Array.isArray(data.integrationConnections)
      ? data.integrationConnections
      : [],
    externalFormConnections: Array.isArray(data.externalFormConnections)
      ? data.externalFormConnections
      : [],
    externalFormSubmissions: Array.isArray(data.externalFormSubmissions)
      ? data.externalFormSubmissions
      : [],
    formNotifications: Array.isArray(data.formNotifications) ? data.formNotifications : [],
    monthlyExpenses: Array.isArray(data.monthlyExpenses) ? data.monthlyExpenses : [],
    nextInvoiceNumber: data.nextInvoiceNumber ?? 1001,
  };
}

function loadByKey(key: string): AccountSnapshot | null {
  try {
    const raw = localStorage.getItem(ARCHIVE_PREFIX + key);
    if (!raw) return null;
    const data = JSON.parse(raw) as AccountSnapshot;
    if (!data.user) return null;
    return normalizeSnapshot(data);
  } catch {
    return null;
  }
}

function snapshotScore(s: AccountSnapshot): number {
  return (s.events?.length ?? 0) * 10 + (s.business ? 5 : 0) + (s.leads?.length ?? 0);
}

/** טוען את העותק העשיר ביותר מכל המפתחות הרלוונטיים */
export function findAccountSnapshot(
  displayName: string,
  email?: string,
): AccountSnapshot | null {
  const keys = accountKeysForUser(displayName, email);
  let best: AccountSnapshot | null = null;
  let bestScore = -1;

  for (const key of keys) {
    const snap = loadByKey(key);
    if (!snap) continue;
    const score = snapshotScore(snap);
    if (score > bestScore) {
      best = snap;
      bestScore = score;
    }
  }
  return best;
}

export function loadAccountSnapshot(key: string): AccountSnapshot | null {
  return loadByKey(key);
}

export function saveAccountSnapshot(
  displayName: string,
  email: string | undefined,
  state: AppState,
): void {
  const payload = JSON.stringify(snapshotFromState(state));
  const keys = accountKeysForUser(displayName, email);
  if (keys.length === 0) return;

  try {
    for (const key of keys) {
      localStorage.setItem(ARCHIVE_PREFIX + key, payload);
    }
  } catch (e) {
    console.warn('לא ניתן לגבות חשבון מקומי:', e);
  }
}

export function flushAccountSnapshot(state: AppState): void {
  if (!state.user) return;
  saveAccountSnapshot(state.user.displayName, state.user.email, state);
}
