/** Unified integrations platform — provider-agnostic types */

export type IntegrationCategory = 'finance' | 'leads' | 'calendar' | 'communication' | 'marketing';

/** @deprecated use leads */
export type LegacyIntegrationCategory = IntegrationCategory | 'marketing';

export type ConnectionStatus =
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'mock'
  | 'sandbox'
  | 'syncing';

export type IntegrationMode = 'mock' | 'sandbox' | 'production';

export type IntegrationSyncStatus = 'not_synced' | 'synced' | 'failed' | 'idle' | 'syncing' | 'success' | 'error';

export type FinanceProviderId =
  | 'mock_finance'
  | 'morning'
  | 'icount'
  | 'grow'
  | 'cardcom'
  | 'meshulam'
  | 'tranzila'
  | 'pelecard'
  /** @deprecated use mock_finance */
  | 'mock';

export type LeadsProviderId = 'meta_leads';

export type CalendarProviderId = 'google_calendar' | 'outlook_calendar' | 'apple_calendar';

export type CommunicationProviderId = 'whatsapp_business' | 'gmail' | 'outlook_mail';

export type ProviderId =
  | FinanceProviderId
  | LeadsProviderId
  | CalendarProviderId
  | CommunicationProviderId
  | 'instagram'
  | 'google_forms'
  | 'typeform';

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
  connectSteps?: string[];
  credentialFields?: 'single' | 'dual';
  /** Only this provider can be connected without real credentials */
  mockConnect?: boolean;
}

export interface IntegrationConnection {
  id: string;
  businessId: string;
  /** Owner user id */
  ownerId: string;
  /** @deprecated use ownerId */
  userId?: string;
  providerId: ProviderId;
  /** @deprecated use providerId */
  provider?: ProviderId;
  providerName: string;
  category: IntegrationCategory;
  status: ConnectionStatus;
  /** @deprecated use status */
  connectionStatus?: ConnectionStatus;
  mode: IntegrationMode;
  authMethod: AuthMethod;
  /** Never stored client-side — server only */
  credentialsEncrypted?: string;
  lastSyncAt?: string;
  /** @deprecated use lastSyncAt */
  lastSync?: string;
  nextSync?: string;
  syncStatus: IntegrationSyncStatus;
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
  providerId: ProviderId;
  action: string;
  status: 'success' | 'failed';
  message: string;
  rawRequest?: string;
  rawResponse?: string;
  createdAt: string;
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

export interface FinanceReceiptInput {
  externalInvoiceId: string;
  amount: number;
  clientName: string;
}

export interface FinanceDocumentResult {
  externalInvoiceId: string;
  externalDocumentNumber: string;
  externalPdfUrl?: string;
  paymentLink?: string;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  /** @deprecated */
  providerDocumentId?: string;
  providerInvoiceNumber?: string;
  officialPdfUrl?: string;
  paymentUrl?: string;
  raw?: unknown;
}

export interface PaymentLinkResult {
  paymentLink: string;
  externalTransactionId: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  expiresAt?: string;
  /** @deprecated */
  paymentUrl?: string;
  providerTransactionId?: string;
}

export interface WebhookProcessResult {
  processed: boolean;
  duplicate: boolean;
  invoiceId?: string;
  externalInvoiceId?: string;
  paymentStatus?: 'paid' | 'failed' | 'pending';
  externalTransactionId?: string;
  paidAt?: string;
  message?: string;
}

export interface WebhookPaymentUpdate extends WebhookProcessResult {
  businessId?: string;
  providerId?: ProviderId;
  amount?: number;
}

export interface IntegrationWebhookEvent {
  id: string;
  providerId: ProviderId;
  externalEventId: string;
  receivedAt: string;
  processed: boolean;
  invoiceId?: string;
  rawPayload: unknown;
}

/** Normalize legacy connection records */
export function normalizeIntegrationConnection(
  raw: IntegrationConnection & { provider?: ProviderId; userId?: string },
): IntegrationConnection {
  const providerId = (raw.providerId ?? raw.provider ?? 'mock_finance') as ProviderId;
  const legacyProvider = (providerId === 'mock' ? 'mock_finance' : providerId) as ProviderId;
  const status =
    raw.status ??
    raw.connectionStatus ??
    (raw.mode === 'mock' ? 'connected' : 'disconnected');
  const mode =
    raw.mode ??
    (legacyProvider === 'mock_finance' || (providerId as string) === 'mock' ? 'mock' : 'production');

  return {
    ...raw,
    providerId: legacyProvider,
    ownerId: raw.ownerId ?? raw.userId ?? '',
    providerName: raw.providerName ?? legacyProvider,
    status,
    mode,
    lastSyncAt: raw.lastSyncAt ?? raw.lastSync,
    createdAt: raw.createdAt ?? raw.connectedAt ?? raw.updatedAt,
    syncStatus: raw.syncStatus ?? 'idle',
  };
}
