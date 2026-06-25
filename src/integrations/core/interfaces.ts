import type {
  FinanceCustomerInput,
  FinanceDocumentResult,
  FinanceInvoiceInput,
  FinanceProviderId,
  IntegrationConnection,
  PaymentLinkResult,
  ProviderHealthResult,
  ProviderId,
  SyncResult,
  WebhookProcessResult,
} from '../../types/integrations';

/** Base provider contract — all categories */
export interface BusinessProvider {
  readonly id: ProviderId;
  readonly category: IntegrationConnection['category'];

  connect(credentials: ProviderCredentials): Promise<IntegrationConnection>;
  disconnect(connectionId: string): Promise<void>;
  sync(connectionId: string): Promise<SyncResult>;
  healthCheck(connectionId: string): Promise<ProviderHealthResult>;
}

export interface ProviderCredentials {
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  accountLabel?: string;
}

/** Finance provider contract */
export interface FinanceProvider extends BusinessProvider {
  readonly id: FinanceProviderId;
  readonly category: 'finance';

  createCustomer(connectionId: string, input: FinanceCustomerInput): Promise<{ externalId: string }>;
  createInvoice(connectionId: string, input: FinanceInvoiceInput): Promise<FinanceDocumentResult>;
  createReceipt(connectionId: string, invoiceExternalId: string): Promise<FinanceDocumentResult>;
  createPaymentLink(
    connectionId: string,
    invoiceExternalId: string,
    amount: number,
  ): Promise<PaymentLinkResult>;
  cancelInvoice(connectionId: string, invoiceExternalId: string): Promise<void>;
  getInvoice(connectionId: string, invoiceExternalId: string): Promise<FinanceDocumentResult>;
  downloadPDF(connectionId: string, invoiceExternalId: string): Promise<{ url: string }>;
  getPaymentStatus(connectionId: string, transactionId: string): Promise<PaymentLinkResult['status']>;
  handleWebhook(payload: unknown, headers: Record<string, string>): Promise<WebhookProcessResult>;
}

export interface CalendarProvider extends BusinessProvider {
  readonly category: 'calendar';
  pushEvent(connectionId: string, event: CalendarEventPayload): Promise<{ externalId: string }>;
}

export interface CalendarEventPayload {
  title: string;
  startDate: string;
  endDate?: string;
  location?: string;
  notes?: string;
}

export interface MarketingProvider extends BusinessProvider {
  readonly category: 'marketing';
  importLeads(connectionId: string): Promise<{ count: number }>;
}

export interface CommunicationProvider extends BusinessProvider {
  readonly category: 'communication';
  sendMessage(connectionId: string, params: SendMessageParams): Promise<{ messageId: string }>;
}

export interface SendMessageParams {
  to: string;
  subject?: string;
  body: string;
  attachmentUrl?: string;
}
