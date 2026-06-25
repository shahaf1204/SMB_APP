import { createId } from '../../../lib/ids';
import type {
  FinanceDocumentResult,
  FinanceInvoiceInput,
  FinanceProviderId,
  IntegrationConnection,
  PaymentLinkResult,
  ProviderHealthResult,
  SyncResult,
  WebhookProcessResult,
} from '../../../types/integrations';
import type { FinanceProvider, ProviderCredentials } from '../../core/interfaces';

const connections = new Map<string, IntegrationConnection>();

function nowIso() {
  return new Date().toISOString();
}

export abstract class BaseFinanceProvider implements FinanceProvider {
  abstract readonly id: FinanceProviderId;
  readonly category = 'finance' as const;

  async connect(credentials: ProviderCredentials): Promise<IntegrationConnection> {
    const conn: IntegrationConnection = {
      id: createId(),
      businessId: '',
      userId: '',
      category: 'finance',
      provider: this.id,
      connectionStatus: 'connected',
      authMethod: 'api_key',
      syncStatus: 'idle',
      connectedAt: nowIso(),
      updatedAt: nowIso(),
      accountLabel: credentials.accountLabel ?? `${this.id} account`,
    };
    connections.set(conn.id, conn);
    return conn;
  }

  async disconnect(connectionId: string): Promise<void> {
    connections.delete(connectionId);
  }

  async sync(_connectionId: string): Promise<SyncResult> {
    return {
      ok: true,
      syncedAt: nowIso(),
      itemsProcessed: 0,
      message: 'סנכרון הושלם',
    };
  }

  async healthCheck(_connectionId: string): Promise<ProviderHealthResult> {
    return { ok: true, message: 'מחובר', latencyMs: 42 };
  }

  async createCustomer(_connectionId: string, input: { name: string }) {
    return { externalId: `cust_${createId().slice(0, 8)}_${input.name.slice(0, 4)}` };
  }

  abstract createInvoice(
    connectionId: string,
    input: FinanceInvoiceInput,
  ): Promise<FinanceDocumentResult>;

  async createReceipt(connectionId: string, invoiceExternalId: string) {
    return this.getInvoice(connectionId, invoiceExternalId);
  }

  async createPaymentLink(
    _connectionId: string,
    invoiceExternalId: string,
    amount: number,
  ): Promise<PaymentLinkResult> {
    const txId = `pay_${createId().slice(0, 10)}`;
    return {
      paymentUrl: `https://pay.demo.smb-app.local/${invoiceExternalId}?amount=${amount}`,
      providerTransactionId: txId,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    };
  }

  async cancelInvoice(_connectionId: string, _invoiceExternalId: string): Promise<void> {}

  async getInvoice(_connectionId: string, invoiceExternalId: string): Promise<FinanceDocumentResult> {
    return {
      providerDocumentId: invoiceExternalId,
      providerInvoiceNumber: invoiceExternalId.replace('doc_', '#'),
      officialPdfUrl: `https://docs.demo.smb-app.local/${invoiceExternalId}.pdf`,
      status: 'sent',
    };
  }

  async downloadPDF(_connectionId: string, invoiceExternalId: string) {
    return { url: `https://docs.demo.smb-app.local/${invoiceExternalId}.pdf` };
  }

  async getPaymentStatus(_connectionId: string, _transactionId: string) {
    return 'pending' as const;
  }

  async handleWebhook(payload: unknown, _headers?: Record<string, string>): Promise<WebhookProcessResult> {
    const body = payload as { event_id?: string; invoice_id?: string; status?: string };
    return {
      processed: true,
      duplicate: false,
      invoiceId: body.invoice_id,
      paymentStatus: body.status ?? 'paid',
    };
  }
}

export class MockFinanceProvider extends BaseFinanceProvider {
  readonly id = 'mock' as const;

  async createInvoice(_connectionId: string, input: FinanceInvoiceInput): Promise<FinanceDocumentResult> {
    const docId = `doc_${createId().slice(0, 12)}`;
    const num = Math.floor(10000 + Math.random() * 89999);
    return {
      providerDocumentId: docId,
      providerInvoiceNumber: String(num),
      officialPdfUrl: `https://docs.demo.smb-app.local/${docId}.pdf`,
      paymentUrl: `https://pay.demo.smb-app.local/${docId}?amount=${input.amount}`,
      status: 'sent',
    };
  }
}

/** Stub — real API in future phase */
export class MorningFinanceProvider extends BaseFinanceProvider {
  readonly id = 'morning' as const;

  async createInvoice(connectionId: string, input: FinanceInvoiceInput) {
    const result = await new MockFinanceProvider().createInvoice(connectionId, input);
    return { ...result, providerDocumentId: `morning_${result.providerDocumentId}` };
  }
}

export class GrowFinanceProvider extends BaseFinanceProvider {
  readonly id = 'grow' as const;

  async createInvoice(connectionId: string, input: FinanceInvoiceInput) {
    const result = await new MockFinanceProvider().createInvoice(connectionId, input);
    return { ...result, providerDocumentId: `grow_${result.providerDocumentId}` };
  }
}

export class ICountFinanceProvider extends BaseFinanceProvider {
  readonly id = 'icount' as const;
  async createInvoice(c: string, i: FinanceInvoiceInput) {
    const r = await new MockFinanceProvider().createInvoice(c, i);
    return { ...r, providerDocumentId: `icount_${r.providerDocumentId}` };
  }
}

export class CardcomFinanceProvider extends BaseFinanceProvider {
  readonly id = 'cardcom' as const;
  async createInvoice(c: string, i: FinanceInvoiceInput) {
    const r = await new MockFinanceProvider().createInvoice(c, i);
    return { ...r, providerDocumentId: `cardcom_${r.providerDocumentId}` };
  }
}

export class MeshulamFinanceProvider extends BaseFinanceProvider {
  readonly id = 'meshulam' as const;
  async createInvoice(c: string, i: FinanceInvoiceInput) {
    const r = await new MockFinanceProvider().createInvoice(c, i);
    return { ...r, providerDocumentId: `meshulam_${r.providerDocumentId}` };
  }
}

export class TranzilaFinanceProvider extends BaseFinanceProvider {
  readonly id = 'tranzila' as const;
  async createInvoice(c: string, i: FinanceInvoiceInput) {
    const r = await new MockFinanceProvider().createInvoice(c, i);
    return { ...r, providerDocumentId: `tranzila_${r.providerDocumentId}` };
  }
}

export class PelecardFinanceProvider extends BaseFinanceProvider {
  readonly id = 'pelecard' as const;
  async createInvoice(c: string, i: FinanceInvoiceInput) {
    const r = await new MockFinanceProvider().createInvoice(c, i);
    return { ...r, providerDocumentId: `pelecard_${r.providerDocumentId}` };
  }
}
