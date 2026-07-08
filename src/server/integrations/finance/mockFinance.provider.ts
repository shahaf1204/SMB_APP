import type {
  FinanceInvoiceInput,
  FinanceInvoiceResult,
  FinancePaymentLinkResult,
  FinanceProvider,
} from './financeProvider.interface';

function newId(): string {
  return crypto.randomUUID();
}

function normalizeProviderId(provider: string): string {
  return provider === 'mock' ? 'mock_finance' : provider;
}

export function createMockInvoice(
  provider: string,
  input: FinanceInvoiceInput,
): FinanceInvoiceResult {
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
): FinancePaymentLinkResult {
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

export const mockFinanceProvider: FinanceProvider = {
  providerId: 'mock_finance',

  async createInvoice(input) {
    return createMockInvoice('mock_finance', input);
  },

  async createPaymentLink(providerDocumentId, amount) {
    return createMockPaymentLink(providerDocumentId, amount);
  },

  async testConnection() {
    return {
      ok: true,
      message: 'ספק הבדיקות מוכן — ניתן להפיק חשבוניות וקישורי תשלום',
      latencyMs: 18,
    };
  },
};

export function testMockConnection(): { ok: boolean; message?: string; latencyMs?: number } {
  return {
    ok: true,
    message: 'ספק הבדיקות מוכן — ניתן להפיק חשבוניות וקישורי תשלום',
    latencyMs: 18,
  };
}
