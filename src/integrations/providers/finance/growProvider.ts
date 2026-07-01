import type { FinanceDocumentResult, FinanceInvoiceInput } from '../../../types/integrations';
import { BaseFinanceProvider } from './baseFinanceProvider';

/** TODO: Implement real Grow payment API */
export class GrowFinanceProvider extends BaseFinanceProvider {
  readonly providerId = 'grow' as const;
  readonly providerName = 'Grow';

  async createInvoice(_connectionId: string, _invoice: FinanceInvoiceInput): Promise<FinanceDocumentResult> {
    throw new Error('Grow — חיבור אמיתי יושק בגרסה הבאה');
  }

  async testConnection() {
    return { ok: false, message: 'Grow — בקרוב' };
  }
}

export const growProvider = new GrowFinanceProvider();
