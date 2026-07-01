import { getFinanceProvider } from '../../integrations/core/registry';
import { getCatalogEntry } from '../../integrations/catalog';
import { createId } from '../ids';
import type {
  FinanceDocumentResult,
  IntegrationConnection,
  PaymentLinkResult,
  ProviderId,
  WebhookPaymentUpdate,
} from '../../types/integrations';
import type { Invoice } from '../../types/models';
import { normalizeIntegrationConnection } from '../../types/integrations';
import {
  connectProvider,
  createProviderPaymentLink,
  pushInvoiceToProvider,
  syncProvider,
} from './client';
import { mapDocumentToInvoicePatch, mapPaymentLinkToInvoicePatch } from './invoiceHelpers';

export function resolveProviderId(connection: IntegrationConnection): ProviderId {
  const c = normalizeIntegrationConnection(connection as IntegrationConnection & { provider?: ProviderId });
  return c.providerId;
}

export function getActiveFinanceConnection(
  connections: IntegrationConnection[],
  businessId: string,
): IntegrationConnection | undefined {
  return connections
    .map((c) => normalizeIntegrationConnection(c as IntegrationConnection & { provider?: ProviderId }))
    .find(
      (c) =>
        c.businessId === businessId &&
        c.category === 'finance' &&
        (c.status === 'connected' || c.status === 'mock' || c.status === 'sandbox'),
    );
}

export async function connectMockFinanceProvider(params: {
  businessId: string;
  ownerId: string;
}): Promise<IntegrationConnection> {
  return connectProvider({
    businessId: params.businessId,
    userId: params.ownerId,
    provider: 'mock_finance',
    accountLabel: 'ספק בדיקות',
  });
}

export async function testProviderConnection(params: {
  connection: IntegrationConnection;
  businessId: string;
}): Promise<{ ok: boolean; message?: string }> {
  const providerId = resolveProviderId(params.connection);
  try {
    const provider = getFinanceProvider(providerId as never);
    return provider.testConnection(params.connection.id);
  } catch {
    const result = await syncProvider({
      connectionId: params.connection.id,
      businessId: params.businessId,
      provider: providerId,
    });
    return { ok: result.ok, message: result.message ?? result.error };
  }
}

export async function issueOfficialInvoice(params: {
  connection: IntegrationConnection;
  businessId: string;
  invoice: Invoice;
}): Promise<FinanceDocumentResult> {
  const providerId = resolveProviderId(params.connection);
  const result = await pushInvoiceToProvider({
    businessId: params.businessId,
    connectionId: params.connection.id,
    provider: providerId,
    invoice: {
      clientName: params.invoice.clientName,
      clientEmail: params.invoice.clientEmail,
      amount: params.invoice.amount,
      dueDate: params.invoice.dueDate,
      notes: params.invoice.notes,
    },
  });

  return {
    externalInvoiceId: result.externalInvoiceId ?? result.providerDocumentId ?? '',
    externalDocumentNumber: result.externalDocumentNumber ?? result.providerInvoiceNumber ?? '',
    externalPdfUrl: result.externalPdfUrl ?? result.officialPdfUrl,
    paymentLink: result.paymentLink ?? result.paymentUrl,
    status: result.status,
    providerDocumentId: result.providerDocumentId ?? result.externalInvoiceId,
    providerInvoiceNumber: result.providerInvoiceNumber ?? result.externalDocumentNumber,
    officialPdfUrl: result.officialPdfUrl ?? result.externalPdfUrl,
    paymentUrl: result.paymentUrl ?? result.paymentLink,
  };
}

export async function createInvoicePaymentLink(params: {
  connection: IntegrationConnection;
  invoice: Invoice;
}): Promise<PaymentLinkResult> {
  const providerId = resolveProviderId(params.connection);
  const externalInvoiceId =
    params.invoice.externalInvoiceId ?? params.invoice.providerDocumentId;
  if (!externalInvoiceId) throw new Error('חסר מזהה חשבונית חיצוני');

  const result = await createProviderPaymentLink({
    connectionId: params.connection.id,
    provider: providerId,
    providerDocumentId: externalInvoiceId,
    amount: params.invoice.amount,
  });

  return {
    paymentLink: result.paymentLink ?? result.paymentUrl ?? '',
    externalTransactionId: result.externalTransactionId ?? result.providerTransactionId ?? '',
    status: result.status,
    expiresAt: result.expiresAt,
    paymentUrl: result.paymentUrl ?? result.paymentLink,
    providerTransactionId: result.providerTransactionId ?? result.externalTransactionId,
  };
}

export function buildInvoicePatchFromDocument(providerId: string, doc: FinanceDocumentResult) {
  return mapDocumentToInvoicePatch(providerId, doc);
}

export function buildInvoicePatchFromPaymentLink(link: PaymentLinkResult) {
  return mapPaymentLinkToInvoicePatch(link);
}

export function buildPaymentTransaction(params: {
  businessId: string;
  invoiceId: string;
  providerId: string;
  link: PaymentLinkResult;
  amount: number;
  clientId?: string;
}) {
  const now = new Date().toISOString();
  return {
    id: createId(),
    businessId: params.businessId,
    invoiceId: params.invoiceId,
    clientId: params.clientId,
    providerId: params.providerId,
    externalTransactionId:
      params.link.externalTransactionId ?? params.link.providerTransactionId ?? createId(),
    amount: params.amount,
    currency: 'ILS' as const,
    status: params.link.status === 'paid' ? ('paid' as const) : ('pending' as const),
    paymentLink: params.link.paymentLink ?? params.link.paymentUrl,
    createdAt: now,
    paidAt: params.link.status === 'paid' ? now : undefined,
  };
}

export function buildIntegrationLog(params: {
  businessId: string;
  connectionId?: string;
  providerId: ProviderId;
  action: string;
  status: 'success' | 'failed';
  message: string;
  rawRequest?: unknown;
  rawResponse?: unknown;
}) {
  return {
    id: createId(),
    businessId: params.businessId,
    connectionId: params.connectionId,
    providerId: params.providerId,
    action: params.action,
    status: params.status,
    message: params.message,
    rawRequest: params.rawRequest ? JSON.stringify(params.rawRequest) : undefined,
    rawResponse: params.rawResponse ? JSON.stringify(params.rawResponse) : undefined,
    createdAt: new Date().toISOString(),
  };
}

export function applyWebhookPaymentUpdate(
  invoices: Invoice[],
  paymentTransactions: import('../../types/models').PaymentTransaction[],
  update: WebhookPaymentUpdate,
): { invoices: Invoice[]; paymentTransactions: import('../../types/models').PaymentTransaction[] } {
  const paidAt = update.paidAt ?? new Date().toISOString();
  const nextInvoices = invoices.map((inv) => {
    const matchesLocal = update.invoiceId && inv.id === update.invoiceId;
    const matchesExternal =
      update.externalInvoiceId &&
      (inv.externalInvoiceId === update.externalInvoiceId ||
        inv.providerDocumentId === update.externalInvoiceId);
    if (!matchesLocal && !matchesExternal) return inv;

    const paid = update.paymentStatus === 'paid';
    return {
      ...inv,
      paymentStatus: paid ? ('paid' as const) : update.paymentStatus === 'failed' ? ('failed' as const) : inv.paymentStatus,
      status: paid ? ('paid' as const) : inv.status,
      paidAt: paid ? paidAt : inv.paidAt,
      paymentTransactionId: update.externalTransactionId ?? inv.paymentTransactionId,
    };
  });

  const nextTx = paymentTransactions.map((tx) => {
    if (update.externalTransactionId && tx.externalTransactionId !== update.externalTransactionId) {
      return tx;
    }
    if (update.invoiceId && tx.invoiceId !== update.invoiceId) return tx;
    const paid = update.paymentStatus === 'paid';
    return {
      ...tx,
      status: paid ? ('paid' as const) : update.paymentStatus === 'failed' ? ('failed' as const) : tx.status,
      paidAt: paid ? paidAt : tx.paidAt,
    };
  });

  return { invoices: nextInvoices, paymentTransactions: nextTx };
}

export function providerDisplayName(providerId: string): string {
  return getCatalogEntry(providerId)?.nameHe ?? providerId;
}
