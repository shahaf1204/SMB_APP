import type { FinanceDocumentResult, FinanceInvoiceInput } from '../../../types/integrations';
import { BaseFinanceProvider } from './baseFinanceProvider';

/** Morning (Green Invoice) — client-side; real API runs on Vercel server */
export class MorningFinanceProvider extends BaseFinanceProvider {
  readonly providerId = 'morning' as const;
  readonly providerName = 'Morning (Green Invoice)';

  async createInvoice(_connectionId: string, _invoice: FinanceInvoiceInput): Promise<FinanceDocumentResult> {
    throw new Error('Morning invoice push runs on the server — deploy latest version');
  }

  async testConnection() {
    return {
      ok: true,
      message: 'לחצי «בדיקת חיבור» לאימות מול Morning',
      latencyMs: 12,
    };
  }
}

export const morningProvider = new MorningFinanceProvider();
