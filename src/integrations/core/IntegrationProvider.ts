import type {
  FinanceCustomerInput,
  FinanceDocumentResult,
  FinanceInvoiceInput,
  FinanceProviderId,
  FinanceReceiptInput,
  IntegrationConnection,
  IntegrationCategory,
  PaymentLinkResult,
  ProviderHealthResult,
  ProviderId,
  SyncResult,
  WebhookProcessResult,
} from '../../types/integrations';

export interface ProviderCredentials {
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  accountLabel?: string;
}

export interface ConnectParams {
  businessId: string;
  ownerId: string;
  credentials?: ProviderCredentials;
  mode?: IntegrationConnection['mode'];
}

/** Base provider contract — all categories */
export interface IntegrationProvider {
  readonly providerId: ProviderId;
  readonly providerName: string;
  readonly category: IntegrationCategory;

  connect(params: ConnectParams): Promise<IntegrationConnection>;
  disconnect(connectionId: string): Promise<void>;
  testConnection(connectionId: string): Promise<ProviderHealthResult>;
  sync(connectionId: string): Promise<SyncResult>;
  getConnectionStatus(connectionId: string): IntegrationConnection['status'];
}

/** Finance provider contract */
export interface FinanceProvider extends IntegrationProvider {
  readonly providerId: FinanceProviderId;
  readonly category: 'finance';

  createCustomer(connectionId: string, customer: FinanceCustomerInput): Promise<{ externalId: string }>;
  createInvoice(connectionId: string, invoice: FinanceInvoiceInput): Promise<FinanceDocumentResult>;
  createReceipt(connectionId: string, receipt: FinanceReceiptInput): Promise<FinanceDocumentResult>;
  createPaymentLink(connectionId: string, invoice: FinanceInvoiceInput & { externalInvoiceId: string }): Promise<PaymentLinkResult>;
  getInvoiceStatus(connectionId: string, externalInvoiceId: string): Promise<FinanceDocumentResult['status']>;
  getPaymentStatus(connectionId: string, externalPaymentId: string): Promise<PaymentLinkResult['status']>;
  getDocumentPdf(connectionId: string, externalDocumentId: string): Promise<{ url: string }>;
  handleWebhook(payload: unknown, headers?: Record<string, string>): Promise<WebhookProcessResult>;
}

export interface CalendarEventPayload {
  title: string;
  startDate: string;
  endDate?: string;
  location?: string;
  notes?: string;
}

export interface CalendarProvider extends IntegrationProvider {
  readonly category: 'calendar';
  pushEvent(connectionId: string, event: CalendarEventPayload): Promise<{ externalId: string }>;
}

export interface LeadsProvider extends IntegrationProvider {
  readonly category: 'leads';
  importLeads(connectionId: string): Promise<{ count: number }>;
}

export interface CommunicationProvider extends IntegrationProvider {
  readonly category: 'communication';
  sendMessage(
    connectionId: string,
    params: { to: string; subject?: string; body: string; attachmentUrl?: string },
  ): Promise<{ messageId: string }>;
}

/** @deprecated use IntegrationProvider */
export type BusinessProvider = IntegrationProvider;
