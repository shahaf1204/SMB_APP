import { getCatalogEntry } from '../../integrations/catalog';
import { createId } from '../ids';
import type { IntegrationConnection, ProviderId } from '../../types/integrations';

/** Client-side connection when API is unavailable (e.g. Vercel fn error, local dev) */
export function createLocalConnection(params: {
  businessId: string;
  userId: string;
  provider: ProviderId;
  apiKey?: string;
  accountLabel?: string;
}): IntegrationConnection {
  const entry = getCatalogEntry(params.provider);
  const now = new Date().toISOString();
  const hasKey = Boolean(params.apiKey?.trim());

  return {
    id: createId(),
    businessId: params.businessId,
    userId: params.userId,
    category: entry?.category ?? 'calendar',
    provider: params.provider,
    connectionStatus: 'connected',
    authMethod: hasKey ? 'api_key' : (entry?.authMethod ?? 'oauth'),
    syncStatus: 'idle',
    connectedAt: now,
    updatedAt: now,
    accountLabel: params.accountLabel?.trim() || entry?.nameHe || params.provider,
  };
}

export function createLocalMockInvoice(
  provider: string,
  input: { clientName: string; amount: number },
): {
  providerDocumentId: string;
  providerInvoiceNumber: string;
  officialPdfUrl: string;
  paymentUrl: string;
  status: 'sent';
} {
  const docId = `${provider}_doc_${createId().slice(0, 12)}`;
  const num = String(Math.floor(10000 + Math.random() * 89999));
  return {
    providerDocumentId: docId,
    providerInvoiceNumber: num,
    officialPdfUrl: `https://docs.demo.smb-app.local/${docId}.pdf`,
    paymentUrl: `https://pay.demo.smb-app.local/${docId}?amount=${input.amount}`,
    status: 'sent',
  };
}

export function createLocalPaymentLink(
  providerDocumentId: string,
  amount: number,
): {
  paymentUrl: string;
  providerTransactionId: string;
  status: 'pending';
} {
  return {
    paymentUrl: `https://pay.demo.smb-app.local/${providerDocumentId}?amount=${amount}`,
    providerTransactionId: `pay_${createId().slice(0, 10)}`,
    status: 'pending',
  };
}
