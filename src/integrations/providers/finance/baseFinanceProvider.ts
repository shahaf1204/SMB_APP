import { createId } from '../../../lib/ids';
import type {
  FinanceDocumentResult,
  FinanceInvoiceInput,
  FinanceReceiptInput,
  FinanceProviderId,
  IntegrationConnection,
  PaymentLinkResult,
  ProviderHealthResult,
  SyncResult,
  WebhookProcessResult,
} from '../../../types/integrations';
import type { ConnectParams, FinanceProvider } from '../../core/IntegrationProvider';

const connectionStore = new Map<string, IntegrationConnection>();

function nowIso() {
  return new Date().toISOString();
}

function normalizeDocResult(result: FinanceDocumentResult): FinanceDocumentResult {
  return {
    ...result,
    providerDocumentId: result.externalInvoiceId,
    providerInvoiceNumber: result.externalDocumentNumber,
    officialPdfUrl: result.externalPdfUrl,
    paymentUrl: result.paymentLink,
  };
}

function normalizePaymentLink(result: PaymentLinkResult): PaymentLinkResult {
  return {
    ...result,
    paymentUrl: result.paymentLink,
    providerTransactionId: result.externalTransactionId,
  };
}

export abstract class BaseFinanceProvider implements FinanceProvider {
  abstract readonly providerId: FinanceProviderId;
  abstract readonly providerName: string;
  readonly category = 'finance' as const;

  async connect(params: ConnectParams): Promise<IntegrationConnection> {
    const now = nowIso();
    const conn: IntegrationConnection = {
      id: createId(),
      businessId: params.businessId,
      ownerId: params.ownerId,
      providerId: this.providerId,
      providerName: this.providerName,
      category: 'finance',
      status: 'connected',
      mode: params.mode ?? 'production',
      authMethod: 'api_key',
      syncStatus: 'idle',
      connectedAt: now,
      createdAt: now,
      updatedAt: now,
      accountLabel: params.credentials?.accountLabel ?? this.providerName,
    };
    connectionStore.set(conn.id, conn);
    return conn;
  }

  async disconnect(connectionId: string): Promise<void> {
    connectionStore.delete(connectionId);
  }

  async testConnection(_connectionId: string): Promise<ProviderHealthResult> {
    return { ok: true, message: 'החיבור תקין', latencyMs: 48 };
  }

  async sync(_connectionId: string): Promise<SyncResult> {
    return {
      ok: true,
      syncedAt: nowIso(),
      itemsProcessed: 0,
      message: 'סנכרון הושלם',
    };
  }

  getConnectionStatus(connectionId: string): IntegrationConnection['status'] {
    return connectionStore.has(connectionId) ? 'connected' : 'disconnected';
  }

  async createCustomer(_connectionId: string, customer: { name: string }) {
    return { externalId: `cust_${createId().slice(0, 8)}_${customer.name.slice(0, 4)}` };
  }

  abstract createInvoice(
    connectionId: string,
    invoice: FinanceInvoiceInput,
  ): Promise<FinanceDocumentResult>;

  async createReceipt(connectionId: string, receipt: FinanceReceiptInput) {
    const status = await this.getInvoiceStatus(connectionId, receipt.externalInvoiceId);
    return this.wrapDoc({
      externalInvoiceId: receipt.externalInvoiceId,
      externalDocumentNumber: receipt.externalInvoiceId.replace('doc_', '#'),
      externalPdfUrl: `https://docs.demo.smb-app.local/${receipt.externalInvoiceId}.pdf`,
      status: status === 'paid' ? 'paid' : 'sent',
    });
  }

  async createPaymentLink(
    _connectionId: string,
    invoice: FinanceInvoiceInput & { externalInvoiceId: string },
  ): Promise<PaymentLinkResult> {
    const txId = `pay_${createId().slice(0, 10)}`;
    return normalizePaymentLink({
      paymentLink: `https://pay.demo.smb-app.local/${invoice.externalInvoiceId}?amount=${invoice.amount}`,
      externalTransactionId: txId,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    });
  }

  async getInvoiceStatus(_connectionId: string, _externalInvoiceId: string): Promise<FinanceDocumentResult['status']> {
    return 'sent';
  }

  async getPaymentStatus(_connectionId: string, _externalPaymentId: string) {
    return 'pending' as const;
  }

  async getDocumentPdf(_connectionId: string, externalDocumentId: string) {
    return { url: `https://docs.demo.smb-app.local/${externalDocumentId}.pdf` };
  }

  async handleWebhook(payload: unknown, _headers?: Record<string, string>): Promise<WebhookProcessResult> {
    const body = payload as {
      event_id?: string;
      invoice_id?: string;
      external_invoice_id?: string;
      status?: string;
      transaction_id?: string;
    };
    const paid = body.status === 'paid' || body.status === 'success';
    return {
      processed: true,
      duplicate: false,
      invoiceId: body.invoice_id,
      externalInvoiceId: body.external_invoice_id,
      paymentStatus: paid ? 'paid' : body.status === 'failed' ? 'failed' : 'pending',
      externalTransactionId: body.transaction_id,
      paidAt: paid ? nowIso() : undefined,
      message: paid ? 'תשלום התקבל' : undefined,
    };
  }

  protected wrapDoc(result: FinanceDocumentResult): FinanceDocumentResult {
    return normalizeDocResult(result);
  }
}

export { normalizeDocResult, normalizePaymentLink, connectionStore as financeConnectionStore };
