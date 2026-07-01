/** Server-side integration logic — no imports from src/ (Vercel-safe) */

export type IntegrationCategory = 'finance' | 'leads' | 'calendar' | 'communication';

export type AuthMethod = 'oauth' | 'api_key' | 'webhook_only';

export type IntegrationMode = 'mock' | 'sandbox' | 'production';

export interface IntegrationConnection {
  id: string;
  businessId: string;
  ownerId: string;
  providerId: string;
  providerName: string;
  category: IntegrationCategory;
  status: 'connected' | 'disconnected' | 'error' | 'mock' | 'sandbox' | 'syncing';
  mode: IntegrationMode;
  authMethod: AuthMethod;
  lastSyncAt?: string;
  syncStatus: string;
  lastError?: string;
  connectedAt?: string;
  createdAt: string;
  updatedAt: string;
  accountLabel?: string;
}

export interface IntegrationLog {
  id: string;
  businessId: string;
  connectionId?: string;
  providerId: string;
  action: string;
  status: 'success' | 'failed';
  message: string;
  rawRequest?: string;
  rawResponse?: string;
  createdAt: string;
}

const FINANCE = new Set([
  'mock_finance',
  'mock',
  'morning',
  'icount',
  'grow',
  'cardcom',
  'meshulam',
  'tranzila',
  'pelecard',
]);

const LEADS = new Set(['meta_leads']);
const CALENDAR = new Set(['google_calendar', 'outlook_calendar', 'apple_calendar']);
const COMMUNICATION = new Set(['whatsapp_business', 'gmail', 'outlook_mail']);

const PROVIDER_NAMES: Record<string, string> = {
  mock_finance: 'ספק בדיקות',
  mock: 'ספק בדיקות',
  morning: 'Morning (חשבונית ירוקה)',
  icount: 'iCount',
  grow: 'Grow',
  cardcom: 'Cardcom',
  meta_leads: 'Meta Leads',
  google_calendar: 'Google Calendar',
  whatsapp_business: 'WhatsApp Business',
};

function newId(): string {
  return crypto.randomUUID();
}

function normalizeProviderId(provider: string): string {
  return provider === 'mock' ? 'mock_finance' : provider;
}

function providerMeta(provider: string): {
  category: IntegrationCategory;
  authMethod: AuthMethod;
  name: string;
} {
  const id = normalizeProviderId(provider);
  if (FINANCE.has(id)) {
    return {
      category: 'finance',
      authMethod: 'api_key',
      name: PROVIDER_NAMES[id] ?? id,
    };
  }
  if (LEADS.has(id)) {
    return { category: 'leads', authMethod: 'oauth', name: PROVIDER_NAMES[id] ?? id };
  }
  if (CALENDAR.has(id)) {
    return { category: 'calendar', authMethod: 'oauth', name: PROVIDER_NAMES[id] ?? id };
  }
  if (COMMUNICATION.has(id)) {
    return { category: 'communication', authMethod: 'oauth', name: PROVIDER_NAMES[id] ?? id };
  }
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
  return FINANCE.has(normalizeProviderId(provider));
}

export function createConnection(params: {
  businessId: string;
  userId: string;
  provider: string;
  apiKey?: string;
  accountLabel?: string;
}): IntegrationConnection {
  const providerId = normalizeProviderId(params.provider);
  const meta = providerMeta(providerId);
  const now = new Date().toISOString();
  const isMock = providerId === 'mock_finance';

  if (!isMock && providerId !== 'mock_finance') {
    const realFinance = FINANCE.has(providerId) && providerId !== 'mock_finance';
    if (realFinance) {
      throw new Error('חיבור לספק אמיתי יושק בגרסה הבאה — השתמשו בספק בדיקות');
    }
    throw new Error('חיבור לספק זה עדיין לא זמין');
  }

  return {
    id: newId(),
    businessId: params.businessId,
    ownerId: params.userId,
    providerId,
    providerName: meta.name,
    category: meta.category,
    status: 'connected',
    mode: isMock ? 'mock' : 'production',
    authMethod: params.apiKey?.trim() ? 'api_key' : meta.authMethod,
    syncStatus: 'idle',
    connectedAt: now,
    createdAt: now,
    updatedAt: now,
    accountLabel: params.accountLabel?.trim() || meta.name,
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

export function testConnection(provider: string): {
  ok: boolean;
  message?: string;
  latencyMs?: number;
} {
  const id = normalizeProviderId(provider);
  if (id === 'mock_finance') {
    return {
      ok: true,
      message: 'ספק הבדיקות מוכן — ניתן להפיק חשבוניות וקישורי תשלום',
      latencyMs: 18,
    };
  }
  return { ok: false, message: 'ספק זה עדיין לא זמין' };
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
  externalInvoiceId: string;
  externalDocumentNumber: string;
  externalPdfUrl: string;
  paymentLink: string;
  status: 'sent';
  providerDocumentId: string;
  providerInvoiceNumber: string;
  officialPdfUrl: string;
  paymentUrl: string;
} {
  const docId = `${normalizeProviderId(provider)}_doc_${newId().slice(0, 12)}`;
  const num = String(Math.floor(10000 + Math.random() * 89999));
  const pdf = `https://docs.demo.smb-app.local/${docId}.pdf`;
  const pay = `https://pay.demo.smb-app.local/${docId}?amount=${input.amount}`;
  return {
    externalInvoiceId: docId,
    externalDocumentNumber: num,
    externalPdfUrl: pdf,
    paymentLink: pay,
    status: 'sent',
    providerDocumentId: docId,
    providerInvoiceNumber: num,
    officialPdfUrl: pdf,
    paymentUrl: pay,
  };
}

export function createMockPaymentLink(
  providerDocumentId: string,
  amount: number,
): {
  paymentLink: string;
  externalTransactionId: string;
  status: 'pending';
  expiresAt: string;
  paymentUrl: string;
  providerTransactionId: string;
} {
  const tx = `pay_${newId().slice(0, 10)}`;
  const link = `https://pay.demo.smb-app.local/${providerDocumentId}?amount=${amount}`;
  return {
    paymentLink: link,
    externalTransactionId: tx,
    status: 'pending',
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    paymentUrl: link,
    providerTransactionId: tx,
  };
}

export function parseWebhook(payload: unknown): {
  processed: boolean;
  duplicate: boolean;
  invoiceId?: string;
  externalInvoiceId?: string;
  paymentStatus?: 'paid' | 'failed' | 'pending';
  externalTransactionId?: string;
  paidAt?: string;
  message?: string;
} {
  const body = payload as {
    event_id?: string;
    invoice_id?: string;
    external_invoice_id?: string;
    status?: string;
    event?: string;
    transaction_id?: string;
  };

  const paid =
    body.status === 'paid' ||
    body.status === 'success' ||
    body.event === 'payment.success';
  const failed = body.status === 'failed' || body.event === 'payment.failed';

  return {
    processed: true,
    duplicate: false,
    invoiceId: body.invoice_id,
    externalInvoiceId: body.external_invoice_id,
    paymentStatus: paid ? 'paid' : failed ? 'failed' : 'pending',
    externalTransactionId: body.transaction_id,
    paidAt: paid ? new Date().toISOString() : undefined,
    message: paid ? 'תשלום התקבל' : failed ? 'התשלום נכשל' : undefined,
  };
}

export function simulateWebhook(params: {
  invoiceId?: string;
  externalInvoiceId?: string;
  externalTransactionId?: string;
  event: 'payment.success' | 'payment.failed';
  amount?: number;
}) {
  return parseWebhook({
    invoice_id: params.invoiceId,
    external_invoice_id: params.externalInvoiceId,
    transaction_id: params.externalTransactionId,
    event: params.event,
    status: params.event === 'payment.success' ? 'paid' : 'failed',
    amount: params.amount,
  });
}

export function createIntegrationLog(params: {
  businessId: string;
  connectionId?: string;
  providerId: string;
  action: string;
  status: 'success' | 'failed';
  message: string;
  rawRequest?: unknown;
  rawResponse?: unknown;
}): IntegrationLog {
  return {
    id: newId(),
    businessId: params.businessId,
    connectionId: params.connectionId,
    providerId: params.providerId,
    action: params.action,
    status: params.status,
    message: params.message,
    rawRequest: params.rawRequest ? sanitizeForLog(params.rawRequest) : undefined,
    rawResponse: params.rawResponse ? sanitizeForLog(params.rawResponse) : undefined,
    createdAt: new Date().toISOString(),
  };
}

function sanitizeForLog(value: unknown): string {
  const raw = JSON.stringify(value);
  return raw
    .replace(/"(api[_-]?key|secret|token|password)"\s*:\s*"[^"]*"/gi, '"$1":"[REDACTED]"')
    .slice(0, 4000);
}
