import type { FinanceDocumentResult, FinanceInvoiceInput } from '../../../types/integrations';
import { BaseFinanceProvider } from './baseFinanceProvider';

/** TODO: Implement real Cardcom API */
export class CardcomFinanceProvider extends BaseFinanceProvider {
  readonly providerId = 'cardcom' as const;
  readonly providerName = 'Cardcom';

  async createInvoice(_connectionId: string, _invoice: FinanceInvoiceInput): Promise<FinanceDocumentResult> {
    throw new Error('Cardcom — חיבור אמיתי יושק בגרסה הבאה');
  }

  async testConnection() {
    return { ok: false, message: 'Cardcom — בקרוב' };
  }
}

export const cardcomProvider = new CardcomFinanceProvider();
