import { createId } from '../../../lib/ids';
import type { FinanceDocumentResult, FinanceInvoiceInput } from '../../../types/integrations';
import { BaseFinanceProvider } from './baseFinanceProvider';

/** Fully working mock finance provider for end-to-end testing */
export class MockFinanceProvider extends BaseFinanceProvider {
  readonly providerId = 'mock_finance' as const;
  readonly providerName = 'ספק בדיקות';

  async connect(params: Parameters<BaseFinanceProvider['connect']>[0]) {
    const conn = await super.connect({ ...params, mode: 'mock' });
    return { ...conn, status: 'connected' as const, mode: 'mock' as const };
  }

  async createInvoice(_connectionId: string, invoice: FinanceInvoiceInput): Promise<FinanceDocumentResult> {
    const docId = `doc_${createId().slice(0, 12)}`;
    const num = String(Math.floor(10000 + Math.random() * 89999));
    return this.wrapDoc({
      externalInvoiceId: docId,
      externalDocumentNumber: num,
      externalPdfUrl: `https://docs.demo.smb-app.local/${docId}.pdf`,
      paymentLink: `https://pay.demo.smb-app.local/${docId}?amount=${invoice.amount}`,
      status: 'sent',
    });
  }

  async testConnection(_connectionId: string) {
    return { ok: true, message: 'ספק הבדיקות מוכן — ניתן להפיק חשבוניות וקישורי תשלום', latencyMs: 12 };
  }
}

export const mockFinanceProvider = new MockFinanceProvider();
