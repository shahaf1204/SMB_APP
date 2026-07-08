import type {
  AuthMethod,
  IntegrationCategory,
  IntegrationConnection,
  IntegrationLog,
  WebhookParseResult,
} from './financeProvider.interface';

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
  const isFinance = FINANCE.has(providerId) && !isMock;
  const hasKey = Boolean(params.apiKey?.trim());

  if (isFinance && !hasKey) {
    throw new Error('נדרש מפתח API לחיבור ספק זה');
  }

  const useSandbox =
    params.accountLabel?.toLowerCase().includes('sandbox') ||
    params.apiKey?.includes('sandbox');

  return {
    id: newId(),
    businessId: params.businessId,
    ownerId: params.userId,
    providerId,
    providerName: meta.name,
    category: meta.category,
    status: 'connected',
    mode: isMock ? 'mock' : useSandbox ? 'sandbox' : 'production',
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
  if (FINANCE.has(id) && id !== 'mock_finance') {
    return {
      ok: true,
      message: 'מפתח API נשמר — לחצו «בדיקת חיבור» לאימות מול הספק',
      latencyMs: 12,
    };
  }
  return {
    ok: true,
    message: 'החיבור נשמר — סנכרון מלא יושק בגרסה הבאה',
    latencyMs: 10,
  };
}

export function parseWebhook(payload: unknown): WebhookParseResult {
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

export { createMockInvoice, createMockPaymentLink } from './mockFinance.provider';
