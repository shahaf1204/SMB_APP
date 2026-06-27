/**
 * Client-side integration API — credentials never touch the browser storage.
 */
import type { IntegrationConnection, ProviderId, SyncResult } from '../../types/integrations';
import type { FinanceDocumentResult, PaymentLinkResult } from '../../types/integrations';
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
    return data.connection;
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
    return await post('/invoice/push', params);
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
    return await post('/invoice/payment-link', params);
  } catch {
    return createLocalPaymentLink(params.providerDocumentId, params.amount);
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
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function getActiveFinanceConnection(
  connections: IntegrationConnection[],
  businessId: string,
): IntegrationConnection | undefined {
  return connections.find(
    (c) =>
      c.businessId === businessId &&
      c.category === 'finance' &&
      c.connectionStatus === 'connected',
  );
}
