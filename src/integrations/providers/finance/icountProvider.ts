import type { FinanceDocumentResult, FinanceInvoiceInput } from '../../../types/integrations';
import { BaseFinanceProvider } from './baseFinanceProvider';

/** TODO: Implement real iCount API */
export class ICountFinanceProvider extends BaseFinanceProvider {
  readonly providerId = 'icount' as const;
  readonly providerName = 'iCount';

  async createInvoice(_connectionId: string, _invoice: FinanceInvoiceInput): Promise<FinanceDocumentResult> {
    throw new Error('iCount — חיבור אמיתי יושק בגרסה הבאה');
  }

  async testConnection() {
    return { ok: false, message: 'iCount — בקרוב' };
  }
}

export const icountProvider = new ICountFinanceProvider();
