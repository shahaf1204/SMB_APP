export type IntegrationCategory = 'finance' | 'leads' | 'calendar' | 'communication';

export type AuthMethod = 'oauth' | 'api_key' | 'webhook_only';

export type IntegrationMode = 'mock' | 'sandbox' | 'production';

export interface IntegrationConnection {
  id: string;
  businessId: string;
  ownerId: string;
  providerId: string;
  providerName: string;
  category: IntegrationCategory;
  status: 'connected' | 'disconnected' | 'error' | 'mock' | 'sandbox' | 'syncing';
  mode: IntegrationMode;
  authMethod: AuthMethod;
  lastSyncAt?: string;
  syncStatus: string;
  lastError?: string;
  connectedAt?: string;
  createdAt: string;
  updatedAt: string;
  accountLabel?: string;
}

export interface IntegrationLog {
  id: string;
  businessId: string;
  connectionId?: string;
  providerId: string;
  action: string;
  status: 'success' | 'failed';
  message: string;
  rawRequest?: string;
  rawResponse?: string;
  createdAt: string;
}

export interface FinanceInvoiceInput {
  clientName: string;
  clientEmail?: string;
  amount: number;
  dueDate: string;
  notes?: string;
}

export interface FinanceInvoiceResult {
  externalInvoiceId: string;
  externalDocumentNumber: string;
  externalPdfUrl: string;
  paymentLink: string;
  status: 'sent';
  providerDocumentId: string;
  providerInvoiceNumber: string;
  officialPdfUrl: string;
  paymentUrl: string;
}

export interface FinancePaymentLinkResult {
  paymentLink: string;
  externalTransactionId: string;
  status: 'pending';
  expiresAt: string;
  paymentUrl: string;
  providerTransactionId: string;
}

export interface FinanceProvider {
  providerId: string;
  createInvoice(input: FinanceInvoiceInput): Promise<FinanceInvoiceResult>;
  createPaymentLink(providerDocumentId: string, amount: number): Promise<FinancePaymentLinkResult>;
  testConnection?(): Promise<{ ok: boolean; message?: string; latencyMs?: number }>;
}

export interface WebhookParseResult {
  processed: boolean;
  duplicate: boolean;
  invoiceId?: string;
  externalInvoiceId?: string;
  paymentStatus?: 'paid' | 'failed' | 'pending';
  externalTransactionId?: string;
  paidAt?: string;
  message?: string;
}
