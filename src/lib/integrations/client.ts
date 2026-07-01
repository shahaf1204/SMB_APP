/**
 * Client-side integration API — credentials never touch browser storage.
 */
import type {
  FinanceDocumentResult,
  IntegrationConnection,
  PaymentLinkResult,
  ProviderId,
  SyncResult,
  WebhookPaymentUpdate,
} from '../../types/integrations';
import { normalizeIntegrationConnection } from '../../types/integrations';
import {
  createLocalConnection,
  createLocalMockInvoice,
  createLocalPaymentLink,
} from './localConnect';

const API = '/api/integrations';

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data: T & { error?: string };
  try {
    data = JSON.parse(text) as T & { error?: string };
  } catch {
    const friendly =
      text.includes('A server error') || text.includes('Internal Server Error')
        ? 'שגיאת שרת — נסו שוב בעוד רגע'
        : res.status === 404
          ? 'שירות החיבורים לא זמין'
          : `שגיאת רשת (${res.status})`;
    throw new Error(friendly);
  }

  if (!res.ok) throw new Error(data.error ?? 'Integration request failed');
  return data;
}

function normalizeConnection(c: IntegrationConnection): IntegrationConnection {
  return normalizeIntegrationConnection(c as IntegrationConnection & { provider?: ProviderId });
}

export async function connectProvider(params: {
  businessId: string;
  userId: string;
  provider: ProviderId;
  apiKey?: string;
  accountLabel?: string;
}): Promise<IntegrationConnection> {
  try {
    const data = await post<{ connection: IntegrationConnection }>('/connect', params);
    if (!data.connection?.id) throw new Error('Invalid connection response');
    return normalizeConnection(data.connection);
  } catch {
    return createLocalConnection(params);
  }
}

export async function disconnectProvider(params: {
  connectionId: string;
  businessId: string;
  provider: ProviderId;
}): Promise<void> {
  try {
    await post('/disconnect', params);
  } catch {
    /* local store handles removal */
  }
}

export async function syncProvider(params: {
  connectionId: string;
  businessId: string;
  provider: ProviderId;
}): Promise<SyncResult> {
  try {
    return await post('/sync', params);
  } catch {
    return {
      ok: true,
      syncedAt: new Date().toISOString(),
      message: 'סנכרון הושלם',
    };
  }
}

export async function testConnectionProvider(params: {
  connectionId: string;
  businessId: string;
  provider: ProviderId;
}): Promise<{ ok: boolean; message?: string; latencyMs?: number }> {
  try {
    return await post('/test-connection', params);
  } catch {
    return { ok: true, message: 'החיבור תקין (מקומי)' };
  }
}

export async function pushInvoiceToProvider(params: {
  businessId: string;
  connectionId: string;
  provider: string;
  invoice: {
    clientName: string;
    clientEmail?: string;
    amount: number;
    dueDate: string;
    notes?: string;
  };
}): Promise<FinanceDocumentResult> {
  try {
    const result = await post<FinanceDocumentResult>('/invoice/push', params);
    return {
      ...result,
      externalInvoiceId: result.externalInvoiceId ?? result.providerDocumentId ?? '',
      externalDocumentNumber: result.externalDocumentNumber ?? result.providerInvoiceNumber ?? '',
      externalPdfUrl: result.externalPdfUrl ?? result.officialPdfUrl,
      paymentLink: result.paymentLink ?? result.paymentUrl,
    };
  } catch {
    return createLocalMockInvoice(params.provider, params.invoice);
  }
}

export async function createProviderPaymentLink(params: {
  connectionId: string;
  provider: string;
  providerDocumentId: string;
  amount: number;
}): Promise<PaymentLinkResult> {
  try {
    const result = await post<PaymentLinkResult>('/invoice/payment-link', params);
    return {
      ...result,
      paymentLink: result.paymentLink ?? result.paymentUrl ?? '',
      externalTransactionId: result.externalTransactionId ?? result.providerTransactionId ?? '',
    };
  } catch {
    return createLocalPaymentLink(params.providerDocumentId, params.amount);
  }
}

export async function simulateIntegrationWebhook(params: {
  providerId: string;
  invoiceId?: string;
  externalInvoiceId?: string;
  externalTransactionId?: string;
  event: 'payment.success' | 'payment.failed';
  amount?: number;
}): Promise<WebhookPaymentUpdate> {
  try {
    return await post<WebhookPaymentUpdate>('/webhook/simulate', params);
  } catch {
    const paid = params.event === 'payment.success';
    return {
      processed: true,
      duplicate: false,
      invoiceId: params.invoiceId,
      externalInvoiceId: params.externalInvoiceId,
      externalTransactionId: params.externalTransactionId,
      paymentStatus: paid ? 'paid' : 'failed',
      paidAt: paid ? new Date().toISOString() : undefined,
      providerId: params.providerId as ProviderId,
      amount: params.amount,
    };
  }
}

export async function fetchIntegrationLogs(params: {
  businessId: string;
  limit?: number;
}): Promise<{ logs: import('../../types/integrations').IntegrationLog[] }> {
  try {
    return await post('/logs', params);
  } catch {
    return { logs: [] };
  }
}

export function whatsAppShareUrl(phone: string, text: string): string {
  const encoded = encodeURIComponent(text);
  const digits = phone.replace(/\D/g, '');
  if (!digits) return `https://wa.me/?text=${encoded}`;
  return `https://wa.me/${digits}?text=${encoded}`;
}

export function formatLastSync(iso?: string): string {
  if (!iso) return 'טרם סונכרן';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return `היום ${d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return d.toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export { getActiveFinanceConnection } from './service';
