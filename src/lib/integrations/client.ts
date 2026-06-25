/**
 * Client-side integration API — credentials never touch the browser storage.
 */
import type { IntegrationConnection, ProviderId, SyncResult } from '../../types/integrations';
import type { FinanceDocumentResult, PaymentLinkResult } from '../../types/integrations';

const API = '/api/integrations';

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Integration request failed');
  return data;
}

export async function connectProvider(params: {
  businessId: string;
  userId: string;
  provider: ProviderId;
  apiKey?: string;
  accountLabel?: string;
}): Promise<IntegrationConnection> {
  return post('/connect', params);
}

export async function disconnectProvider(params: {
  connectionId: string;
  businessId: string;
}): Promise<void> {
  await post('/disconnect', params);
}

export async function syncProvider(params: {
  connectionId: string;
  businessId: string;
}): Promise<SyncResult> {
  return post('/sync', params);
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
  return post('/invoice/push', params);
}

export async function createProviderPaymentLink(params: {
  connectionId: string;
  provider: string;
  providerDocumentId: string;
  amount: number;
}): Promise<PaymentLinkResult> {
  return post('/invoice/payment-link', params);
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
