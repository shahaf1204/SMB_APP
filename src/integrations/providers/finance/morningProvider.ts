import type { FinanceDocumentResult, FinanceInvoiceInput } from '../../../types/integrations';
import { BaseFinanceProvider } from './baseFinanceProvider';

/**
 * Morning (Green Invoice) adapter
 * TODO: Implement real Morning API — https://www.greeninvoice.co.il/api-docs
 */
export class MorningFinanceProvider extends BaseFinanceProvider {
  readonly providerId = 'morning' as const;
  readonly providerName = 'Morning (חשבונית ירוקה)';

  async createInvoice(_connectionId: string, _invoice: FinanceInvoiceInput): Promise<FinanceDocumentResult> {
    throw new Error('Morning — חיבור אמיתי יושק בגרסה הבאה');
  }

  async testConnection() {
    return { ok: false, message: 'Morning — בקרוב' };
  }
}

export const morningProvider = new MorningFinanceProvider();
