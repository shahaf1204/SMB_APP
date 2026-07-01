import { getCatalogEntry } from '../../integrations/catalog';
import { createId } from '../ids';
import type { IntegrationConnection, ProviderId } from '../../types/integrations';
import { normalizeIntegrationConnection } from '../../types/integrations';

/** Client-side connection when API is unavailable */
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
  const isMock = params.provider === 'mock_finance' || params.provider === 'mock';

  const raw: IntegrationConnection = {
    id: createId(),
    businessId: params.businessId,
    ownerId: params.userId,
    providerId: isMock ? 'mock_finance' : params.provider,
    providerName: entry?.nameHe ?? params.provider,
    category: entry?.category === 'marketing' ? 'leads' : (entry?.category ?? 'finance'),
    status: 'connected',
    mode: isMock ? 'mock' : 'production',
    authMethod: hasKey ? 'api_key' : (entry?.authMethod ?? 'oauth'),
    syncStatus: 'idle',
    connectedAt: now,
    createdAt: now,
    updatedAt: now,
    accountLabel: params.accountLabel?.trim() || entry?.nameHe || params.provider,
  };

  return normalizeIntegrationConnection(raw);
}

export function createLocalMockInvoice(
  provider: string,
  input: { clientName: string; amount: number },
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
  const docId = `${provider}_doc_${createId().slice(0, 12)}`;
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

export function createLocalPaymentLink(
  providerDocumentId: string,
  amount: number,
): {
  paymentLink: string;
  externalTransactionId: string;
  status: 'pending';
  paymentUrl: string;
  providerTransactionId: string;
} {
  const tx = `pay_${createId().slice(0, 10)}`;
  const link = `https://pay.demo.smb-app.local/${providerDocumentId}?amount=${amount}`;
  return {
    paymentLink: link,
    externalTransactionId: tx,
    status: 'pending',
    paymentUrl: link,
    providerTransactionId: tx,
  };
}
