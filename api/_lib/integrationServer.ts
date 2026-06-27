/** Server-side integration logic — no imports from src/ (Vercel-safe) */

export type IntegrationCategory = 'finance' | 'calendar' | 'marketing' | 'communication';

export type AuthMethod = 'oauth' | 'api_key' | 'webhook_only';

export interface IntegrationConnection {
  id: string;
  businessId: string;
  userId: string;
  category: IntegrationCategory;
  provider: string;
  connectionStatus: 'disconnected' | 'connected' | 'error' | 'syncing';
  authMethod: AuthMethod;
  lastSync?: string;
  nextSync?: string;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastError?: string;
  connectedAt?: string;
  updatedAt: string;
  accountLabel?: string;
}

const FINANCE = new Set([
  'morning',
  'icount',
  'grow',
  'cardcom',
  'meshulam',
  'tranzila',
  'pelecard',
  'mock',
]);

const CALENDAR = new Set(['google_calendar', 'outlook_calendar', 'apple_calendar']);

const MARKETING = new Set(['meta_leads', 'instagram', 'google_forms', 'typeform']);

const COMMUNICATION = new Set(['whatsapp_business', 'gmail', 'outlook_mail']);

function newId(): string {
  return crypto.randomUUID();
}

function providerMeta(provider: string): { category: IntegrationCategory; authMethod: AuthMethod } {
  if (FINANCE.has(provider)) return { category: 'finance', authMethod: 'api_key' };
  if (CALENDAR.has(provider)) return { category: 'calendar', authMethod: 'oauth' };
  if (MARKETING.has(provider)) {
    return {
      category: 'marketing',
      authMethod: provider === 'typeform' ? 'api_key' : 'oauth',
    };
  }
  if (COMMUNICATION.has(provider)) return { category: 'communication', authMethod: 'oauth' };
  throw new Error(`ספק לא מוכר: ${provider}`);
}

export function isKnownProvider(provider: string): boolean {
  try {
    providerMeta(provider);
    return true;
  } catch {
    return false;
  }
}

export function isFinanceProvider(provider: string): boolean {
  return FINANCE.has(provider);
}

export function createConnection(params: {
  businessId: string;
  userId: string;
  provider: string;
  apiKey?: string;
  accountLabel?: string;
}): IntegrationConnection {
  const meta = providerMeta(params.provider);
  const now = new Date().toISOString();
  return {
    id: newId(),
    businessId: params.businessId,
    userId: params.userId,
    category: meta.category,
    provider: params.provider,
    connectionStatus: 'connected',
    authMethod: params.apiKey?.trim() ? 'api_key' : meta.authMethod,
    syncStatus: 'idle',
    connectedAt: now,
    updatedAt: now,
    accountLabel: params.accountLabel?.trim() || params.provider,
  };
}

export function syncConnection(): {
  ok: boolean;
  syncedAt: string;
  itemsProcessed?: number;
  message?: string;
} {
  return {
    ok: true,
    syncedAt: new Date().toISOString(),
    itemsProcessed: 0,
    message: 'סנכרון הושלם',
  };
}

export interface FinanceInvoiceInput {
  clientName: string;
  clientEmail?: string;
  amount: number;
  dueDate: string;
  notes?: string;
}

export function createMockInvoice(
  provider: string,
  input: FinanceInvoiceInput,
): {
  providerDocumentId: string;
  providerInvoiceNumber: string;
  officialPdfUrl: string;
  paymentUrl: string;
  status: 'sent';
} {
  const docId = `${provider}_doc_${newId().slice(0, 12)}`;
  const num = String(Math.floor(10000 + Math.random() * 89999));
  return {
    providerDocumentId: docId,
    providerInvoiceNumber: num,
    officialPdfUrl: `https://docs.demo.smb-app.local/${docId}.pdf`,
    paymentUrl: `https://pay.demo.smb-app.local/${docId}?amount=${input.amount}`,
    status: 'sent',
  };
}

export function createMockPaymentLink(
  providerDocumentId: string,
  amount: number,
): {
  paymentUrl: string;
  providerTransactionId: string;
  status: 'pending';
  expiresAt: string;
} {
  return {
    paymentUrl: `https://pay.demo.smb-app.local/${providerDocumentId}?amount=${amount}`,
    providerTransactionId: `pay_${newId().slice(0, 10)}`,
    status: 'pending',
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
  };
}

export function parseWebhook(payload: unknown): {
  processed: boolean;
  duplicate: boolean;
  invoiceId?: string;
  paymentStatus?: string;
} {
  const body = payload as { event_id?: string; invoice_id?: string; status?: string };
  return {
    processed: true,
    duplicate: false,
    invoiceId: body.invoice_id,
    paymentStatus: body.status ?? 'paid',
  };
}
