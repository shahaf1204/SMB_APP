import type { MetaConnection, MetaConnectionStatus } from '../../types/crm';
import type { MetaOAuthPageCandidate } from '../../types/metaOAuth.client';

export type MetaConnectionUiPhase =
  | 'loading'
  | 'not_connected'
  | 'connecting'
  | 'page_selection'
  | 'success'
  | 'connected'
  | 'error'
  | 'reconnect_required';

export interface MetaConnectionUiContext {
  connectionLoading: boolean;
  connection: MetaConnection | null;
  busy: boolean;
  returningFromOAuth: boolean;
  pageSelectionActive: boolean;
  showSuccessBanner: boolean;
  userErrorCode: string | null;
}

export function resolveMetaConnectionUiPhase(ctx: MetaConnectionUiContext): MetaConnectionUiPhase {
  if (ctx.connectionLoading) return 'loading';
  if (ctx.showSuccessBanner) return 'success';
  if (ctx.pageSelectionActive) return 'page_selection';
  if (ctx.busy || ctx.returningFromOAuth) return 'connecting';

  const status = ctx.connection?.connectionStatus;
  if (status === 'reconnect_required') return 'reconnect_required';

  const isConnected =
    Boolean(ctx.connection?.isActive) && ctx.connection?.connectionStatus === 'connected';
  if (isConnected) return 'connected';

  if (ctx.userErrorCode || status === 'error') return 'error';

  return 'not_connected';
}

export function formatPageDisplayName(page: MetaOAuthPageCandidate): string {
  const name = page.pageName?.trim() || 'עמוד עסק';
  return name;
}

/** User-visible labels use Page name only (Page ID may still be used as the form value — it is not secret). */
export function buildPageSelectionLabels(pages: MetaOAuthPageCandidate[]): string[] {
  return pages.map((p) => formatPageDisplayName(p));
}

export function shouldOfferExplicitPageConfirmation(_pageCount: number): boolean {
  return true;
}

/** Prevents duplicate connect / page-submit actions while work is in flight. */
export function isMetaConnectionActionLocked(busy: boolean): boolean {
  return busy;
}

export function formatLastLeadReceived(iso: string | undefined): string | null {
  if (!iso?.trim()) return null;
  const d = Date.parse(iso);
  if (Number.isNaN(d)) return null;
  return new Intl.DateTimeFormat('he-IL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(d));
}

const FORBIDDEN_RENDER_PATTERNS =
  /access_token|EAA[A-Za-z0-9]{10,}|pages_payload|client_secret|oauth|webhook|leadgen|graph\.facebook/i;

export function assertUserVisibleTextSafe(text: string): boolean {
  return !FORBIDDEN_RENDER_PATTERNS.test(text);
}

export function connectionStatusLabel(status: MetaConnectionStatus | undefined): string {
  switch (status) {
    case 'connected':
      return 'מחובר';
    case 'connecting':
      return 'מתחבר';
    case 'error':
      return 'שגיאה';
    case 'reconnect_required':
      return 'נדרש חידוש';
    case 'disconnected':
    default:
      return 'לא מחובר';
  }
}

export const META_OAUTH_ATTEMPT_SESSION_KEY = 'meta_connection_attempt_v1';

export interface StoredOAuthAttempt {
  attemptId: string;
  businessId: string;
}

export function readStoredOAuthAttempt(businessId: string): StoredOAuthAttempt | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(META_OAUTH_ATTEMPT_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredOAuthAttempt;
    if (parsed.businessId !== businessId || !parsed.attemptId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredOAuthAttempt(data: StoredOAuthAttempt): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(META_OAUTH_ATTEMPT_SESSION_KEY, JSON.stringify(data));
}

export function clearStoredOAuthAttempt(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(META_OAUTH_ATTEMPT_SESSION_KEY);
}
