/** Business Integrations Platform — provider-agnostic types */

export type IntegrationCategory = 'finance' | 'calendar' | 'marketing' | 'communication';

export type ConnectionStatus = 'disconnected' | 'connected' | 'error' | 'syncing';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export type FinanceProviderId =
  | 'morning'
  | 'icount'
  | 'cardcom'
  | 'grow'
  | 'meshulam'
  | 'tranzila'
  | 'pelecard'
  | 'mock';

export type CalendarProviderId = 'google_calendar' | 'outlook_calendar' | 'apple_calendar';

export type MarketingProviderId = 'meta_leads' | 'instagram' | 'google_forms' | 'typeform';

export type CommunicationProviderId = 'whatsapp_business' | 'gmail' | 'outlook_mail';

export type ProviderId =
  | FinanceProviderId
  | CalendarProviderId
  | MarketingProviderId
  | CommunicationProviderId;

export type AuthMethod = 'oauth' | 'api_key' | 'webhook_only';

export interface ProviderCatalogEntry {
  id: ProviderId;
  category: IntegrationCategory;
  name: string;
  nameHe: string;
  description: string;
  authMethod: AuthMethod;
  logoEmoji: string;
  brandColor: string;
  available: boolean;
  comingSoon?: boolean;
  /** Step-by-step connection guide shown in connect modal */
  connectSteps?: string[];
}

export interface IntegrationConnection {
  id: string;
  businessId: string;
  userId: string;
  category: IntegrationCategory;
  provider: ProviderId;
  connectionStatus: ConnectionStatus;
  authMethod: AuthMethod;
  lastSync?: string;
  nextSync?: string;
  syncStatus: SyncStatus;
  lastError?: string;
  connectedAt?: string;
  updatedAt: string;
  /** Display only — e.g. masked email or account name */
  accountLabel?: string;
}

export interface FinanceProviderConnection extends IntegrationConnection {
  category: 'finance';
  provider: FinanceProviderId;
  expiresAt?: string;
}

export interface ProviderHealthResult {
  ok: boolean;
  message?: string;
  latencyMs?: number;
}

export interface SyncResult {
  ok: boolean;
  syncedAt: string;
  itemsProcessed?: number;
  message?: string;
  error?: string;
}

export interface FinanceCustomerInput {
  name: string;
  email?: string;
  phone?: string;
}

export interface FinanceInvoiceInput {
  clientName: string;
  clientEmail?: string;
  amount: number;
  dueDate: string;
  notes?: string;
  currency?: string;
}

export interface FinanceDocumentResult {
  providerDocumentId: string;
  providerInvoiceNumber: string;
  officialPdfUrl?: string;
  paymentUrl?: string;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  raw?: unknown;
}

export interface PaymentLinkResult {
  paymentUrl: string;
  providerTransactionId: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  expiresAt?: string;
}

export interface WebhookProcessResult {
  processed: boolean;
  duplicate: boolean;
  invoiceId?: string;
  paymentStatus?: string;
}

export interface IntegrationWebhookEvent {
  id: string;
  provider: ProviderId;
  externalEventId: string;
  receivedAt: string;
  processed: boolean;
  invoiceId?: string;
  rawPayload: unknown;
}
