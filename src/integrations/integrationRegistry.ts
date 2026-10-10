/**
 * Canonical product/UI integration registry (client-safe).
 *
 * **Server execution boundary:** `src/server/integrations/finance/integration.service.ts`
 * maintains its own allowlist for connect/disconnect API validation. Do not weaken server checks;
 * this registry drives UX truth (status, CTAs, scopes, routing) only.
 */
import type { ProductFeatureEntitlementKey } from '../types/productLayers';
import type { AuthMethod, IntegrationCategory, ProviderId } from '../types/integrations';
import type { ExternalFormProviderId } from '../types/externalForms';

export type IntegrationLifecycleStatus = 'live' | 'beta' | 'coming_soon' | 'hidden';

/** How the hub exposes the integration to the user. */
export type IntegrationHubConnectMode = 'api' | 'route' | 'none';

export type IntegrationSubCategory =
  | 'finance_invoicing'
  | 'finance_payments'
  | 'lead_ads'
  | 'external_forms'
  | 'calendar_sync'
  | 'communication_channel';

export type IntegrationRegistryId = ProviderId | ExternalFormProviderId;

export type ConnectionsScope = 'invoicing' | 'payments';

export interface IntegrationRegistryEntry {
  id: IntegrationRegistryId;
  category: IntegrationCategory | 'leads_forms';
  subCategory: IntegrationSubCategory;
  displayName: string;
  nameHe: string;
  description: string;
  lifecycleStatus: IntegrationLifecycleStatus;
  hubConnectMode: IntegrationHubConnectMode;
  /** Route for route-mode cards (Meta, forms). */
  managementRoute?: string;
  authType: AuthMethod;
  logoEmoji: string;
  brandColor: string;
  premiumFeatureKey?: ProductFeatureEntitlementKey;
  supportedFeatures: string[];
  /** Shown on hub only in Vite dev (mock finance). */
  devOnly?: boolean;
  credentialFields?: 'single' | 'dual';
  connectSteps?: string[];
  /** Hebrew primary CTA on hub cards. */
  connectCtaLabel: string;
}

export const HUB_CATEGORY_ORDER: Array<IntegrationCategory | 'leads_forms'> = [
  'finance',
  'leads_forms',
  'calendar',
  'communication',
];

export const HUB_CATEGORY_LABELS: Record<string, string> = {
  finance: 'כספים',
  leads_forms: 'מקורות לידים וטפסים',
  calendar: 'יומן',
  communication: 'תקשורת',
};

const REGISTRY: IntegrationRegistryEntry[] = [
  {
    id: 'morning',
    category: 'finance',
    subCategory: 'finance_invoicing',
    displayName: 'Morning',
    nameHe: 'Morning (Green Invoice)',
    description: 'חשבוניות מס, קבלות וקישורי תשלום',
    lifecycleStatus: 'live',
    hubConnectMode: 'api',
    authType: 'api_key',
    logoEmoji: '🌿',
    brandColor: '#22c55e',
    premiumFeatureKey: 'invoice_provider_sync',
    supportedFeatures: ['invoice_push', 'test_connection', 'payment_link'],
    credentialFields: 'dual',
    connectCtaLabel: 'חיבור',
    connectSteps: [
      'בחשבון חינמי (Production) אין מפתח API — לבדיקות השתמשי ב-Sandbox',
      'הירשמי (חינם): lp.sandbox.d.greeninvoice.co.il/join',
      'היכנסי: app.sandbox.d.greeninvoice.co.il',
      'הגדרות → מתקדם → מפתחים → «צור מפתח API»',
      'העתיקי API Key ID + Secret',
      'הדביקי למטה — המערכת תזהה Sandbox אוטומטית',
    ],
  },
  {
    id: 'icount',
    category: 'finance',
    subCategory: 'finance_invoicing',
    displayName: 'iCount',
    nameHe: 'iCount',
    description: 'הנהלת חשבונות וחשבוניות מס',
    lifecycleStatus: 'coming_soon',
    hubConnectMode: 'none',
    authType: 'api_key',
    logoEmoji: '📊',
    brandColor: '#3b82f6',
    premiumFeatureKey: 'invoice_provider_sync',
    supportedFeatures: [],
    connectCtaLabel: 'חיבור',
  },
  {
    id: 'mock_finance',
    category: 'finance',
    subCategory: 'finance_invoicing',
    displayName: 'Mock Finance',
    nameHe: 'ספק בדיקות',
    description: 'סימולציה מלאה — חשבוניות, PDF וקישורי תשלום (פיתוח)',
    lifecycleStatus: 'beta',
    hubConnectMode: 'api',
    authType: 'api_key',
    logoEmoji: '🧪',
    brandColor: '#6366f1',
    devOnly: true,
    supportedFeatures: ['invoice_push_mock', 'payment_link_mock', 'webhook_simulate'],
    connectCtaLabel: 'חיבור (בדיקות)',
    connectSteps: [
      'לחצו «חיבור (בדיקות)» — אין צורך במפתח API',
      'הפקת חשבונית דמו, קישור תשלום וסימולציית webhook',
    ],
  },
  {
    id: 'grow',
    category: 'finance',
    subCategory: 'finance_payments',
    displayName: 'Grow',
    nameHe: 'Grow',
    description: 'סליקה וקישורי תשלום מהירים',
    lifecycleStatus: 'coming_soon',
    hubConnectMode: 'none',
    authType: 'api_key',
    logoEmoji: '💳',
    brandColor: '#6366f1',
    premiumFeatureKey: 'payment_provider_sync',
    supportedFeatures: [],
    connectCtaLabel: 'חיבור',
  },
  {
    id: 'cardcom',
    category: 'finance',
    subCategory: 'finance_payments',
    displayName: 'Cardcom',
    nameHe: 'Cardcom',
    description: 'סליקת אשראי ותשלומים',
    lifecycleStatus: 'coming_soon',
    hubConnectMode: 'none',
    authType: 'api_key',
    logoEmoji: '💳',
    brandColor: '#0ea5e9',
    premiumFeatureKey: 'payment_provider_sync',
    supportedFeatures: [],
    connectCtaLabel: 'חיבור',
  },
  {
    id: 'meshulam',
    category: 'finance',
    subCategory: 'finance_payments',
    displayName: 'Meshulam',
    nameHe: 'משולם',
    description: 'Bit, אשראי וקישורי תשלום',
    lifecycleStatus: 'coming_soon',
    hubConnectMode: 'none',
    authType: 'api_key',
    logoEmoji: '🔗',
    brandColor: '#8b5cf6',
    premiumFeatureKey: 'payment_provider_sync',
    supportedFeatures: [],
    connectCtaLabel: 'חיבור',
  },
  {
    id: 'tranzila',
    category: 'finance',
    subCategory: 'finance_payments',
    displayName: 'Tranzila',
    nameHe: 'Tranzila',
    description: 'סליקה ישראלית',
    lifecycleStatus: 'coming_soon',
    hubConnectMode: 'none',
    authType: 'api_key',
    logoEmoji: '🏦',
    brandColor: '#64748b',
    premiumFeatureKey: 'payment_provider_sync',
    supportedFeatures: [],
    connectCtaLabel: 'חיבור',
  },
  {
    id: 'pelecard',
    category: 'finance',
    subCategory: 'finance_payments',
    displayName: 'Pelecard',
    nameHe: 'Pelecard',
    description: 'סליקת אשראי',
    lifecycleStatus: 'coming_soon',
    hubConnectMode: 'none',
    authType: 'api_key',
    logoEmoji: '💳',
    brandColor: '#ef4444',
    premiumFeatureKey: 'payment_provider_sync',
    supportedFeatures: [],
    connectCtaLabel: 'חיבור',
  },
  {
    id: 'meta_leads',
    category: 'leads',
    subCategory: 'lead_ads',
    displayName: 'Meta Lead Ads',
    nameHe: 'Meta Leads',
    description: 'ייבוא לידים ממודעות Lead Ads בפייסבוק',
    lifecycleStatus: 'live',
    hubConnectMode: 'route',
    managementRoute: '/sources/leads',
    authType: 'oauth',
    logoEmoji: '📣',
    brandColor: '#1877f2',
    premiumFeatureKey: 'meta_lead_sync',
    supportedFeatures: ['oauth', 'lead_webhook'],
    connectCtaLabel: 'חיבור מקור',
  },
  {
    id: 'forms_app',
    category: 'leads_forms',
    subCategory: 'external_forms',
    displayName: 'forms.app',
    nameHe: 'forms.app',
    description: 'טפסים חיצוניים — webhook וייבוא לידים',
    lifecycleStatus: 'live',
    hubConnectMode: 'route',
    managementRoute: '/sources/forms/new',
    authType: 'webhook_only',
    logoEmoji: '📝',
    brandColor: '#0d9488',
    premiumFeatureKey: 'external_form_auto_intake',
    supportedFeatures: ['webhook', 'lead_first_intake'],
    connectCtaLabel: 'חיבור טופס',
  },
  {
    id: 'google_forms',
    category: 'leads_forms',
    subCategory: 'external_forms',
    displayName: 'Google Forms',
    nameHe: 'Google Forms',
    description: 'ייבוא תשובות טופס כלידים',
    lifecycleStatus: 'coming_soon',
    hubConnectMode: 'none',
    authType: 'oauth',
    logoEmoji: '📝',
    brandColor: '#673ab7',
    premiumFeatureKey: 'external_form_auto_intake',
    supportedFeatures: [],
    connectCtaLabel: 'חיבור טופס',
  },
  {
    id: 'typeform',
    category: 'leads_forms',
    subCategory: 'external_forms',
    displayName: 'Typeform',
    nameHe: 'Typeform',
    description: 'ייבוא לידים מטפסים',
    lifecycleStatus: 'coming_soon',
    hubConnectMode: 'none',
    authType: 'api_key',
    logoEmoji: '📋',
    brandColor: '#262627',
    premiumFeatureKey: 'external_form_auto_intake',
    supportedFeatures: [],
    connectCtaLabel: 'חיבור טופס',
  },
  {
    id: 'jotform',
    category: 'leads_forms',
    subCategory: 'external_forms',
    displayName: 'Jotform',
    nameHe: 'Jotform',
    description: 'טפסים ולידים מ-Jotform',
    lifecycleStatus: 'coming_soon',
    hubConnectMode: 'none',
    authType: 'webhook_only',
    logoEmoji: '📄',
    brandColor: '#ff6100',
    premiumFeatureKey: 'external_form_auto_intake',
    supportedFeatures: [],
    connectCtaLabel: 'חיבור טופס',
  },
  {
    id: 'tally',
    category: 'leads_forms',
    subCategory: 'external_forms',
    displayName: 'Tally',
    nameHe: 'Tally',
    description: 'טפסים מ-Tally',
    lifecycleStatus: 'coming_soon',
    hubConnectMode: 'none',
    authType: 'webhook_only',
    logoEmoji: '📑',
    brandColor: '#111827',
    premiumFeatureKey: 'external_form_auto_intake',
    supportedFeatures: [],
    connectCtaLabel: 'חיבור טופס',
  },
  {
    id: 'custom',
    category: 'leads_forms',
    subCategory: 'external_forms',
    displayName: 'Custom Webhook',
    nameHe: 'Webhook מותאם',
    description: 'חיבור טופס דרך webhook מותאם',
    lifecycleStatus: 'coming_soon',
    hubConnectMode: 'none',
    authType: 'webhook_only',
    logoEmoji: '🔌',
    brandColor: '#64748b',
    premiumFeatureKey: 'external_form_auto_intake',
    supportedFeatures: [],
    connectCtaLabel: 'חיבור טופס',
  },
  {
    id: 'instagram',
    category: 'leads',
    subCategory: 'lead_ads',
    displayName: 'Instagram',
    nameHe: 'Instagram',
    description: 'אינטגרציה נפרדת — לא זמינה (לידים מ-Meta דרך Meta Leads)',
    lifecycleStatus: 'hidden',
    hubConnectMode: 'none',
    authType: 'oauth',
    logoEmoji: '📸',
    brandColor: '#e4405f',
    supportedFeatures: [],
    connectCtaLabel: 'חיבור מקור',
  },
  {
    id: 'google_calendar',
    category: 'calendar',
    subCategory: 'calendar_sync',
    displayName: 'Google Calendar',
    nameHe: 'Google Calendar',
    description: 'סנכרון אירועים ופגישות',
    lifecycleStatus: 'coming_soon',
    hubConnectMode: 'none',
    authType: 'oauth',
    logoEmoji: '📅',
    brandColor: '#4285f4',
    supportedFeatures: [],
    connectCtaLabel: 'חיבור יומן',
  },
  {
    id: 'outlook_calendar',
    category: 'calendar',
    subCategory: 'calendar_sync',
    displayName: 'Outlook Calendar',
    nameHe: 'Outlook Calendar',
    description: 'סנכרון יומן Microsoft',
    lifecycleStatus: 'coming_soon',
    hubConnectMode: 'none',
    authType: 'oauth',
    logoEmoji: '📆',
    brandColor: '#0078d4',
    supportedFeatures: [],
    connectCtaLabel: 'חיבור יומן',
  },
  {
    id: 'apple_calendar',
    category: 'calendar',
    subCategory: 'calendar_sync',
    displayName: 'Apple Calendar',
    nameHe: 'Apple Calendar',
    description: 'ייצוא וסנכרון iCloud',
    lifecycleStatus: 'coming_soon',
    hubConnectMode: 'none',
    authType: 'oauth',
    logoEmoji: '🍎',
    brandColor: '#1d1d1f',
    supportedFeatures: [],
    connectCtaLabel: 'חיבור יומן',
  },
  {
    id: 'whatsapp_business',
    category: 'communication',
    subCategory: 'communication_channel',
    displayName: 'WhatsApp Business',
    nameHe: 'WhatsApp Business',
    description: 'ערוץ תקשורת עסקי (לא שיתוף wa.me ידני)',
    lifecycleStatus: 'coming_soon',
    hubConnectMode: 'none',
    authType: 'oauth',
    logoEmoji: '💬',
    brandColor: '#25d366',
    premiumFeatureKey: 'customer_messaging',
    supportedFeatures: [],
    connectCtaLabel: 'חיבור ערוץ',
  },
  {
    id: 'gmail',
    category: 'communication',
    subCategory: 'communication_channel',
    displayName: 'Gmail',
    nameHe: 'Gmail',
    description: 'שליחת מיילים ללקוחות מהמערכת',
    lifecycleStatus: 'coming_soon',
    hubConnectMode: 'none',
    authType: 'oauth',
    logoEmoji: '✉️',
    brandColor: '#ea4335',
    premiumFeatureKey: 'customer_messaging',
    supportedFeatures: [],
    connectCtaLabel: 'חיבור ערוץ',
  },
  {
    id: 'outlook_mail',
    category: 'communication',
    subCategory: 'communication_channel',
    displayName: 'Outlook Mail',
    nameHe: 'Outlook Mail',
    description: 'שליחת מיילים מ-Microsoft',
    lifecycleStatus: 'coming_soon',
    hubConnectMode: 'none',
    authType: 'oauth',
    logoEmoji: '📧',
    brandColor: '#0078d4',
    premiumFeatureKey: 'customer_messaging',
    supportedFeatures: [],
    connectCtaLabel: 'חיבור ערוץ',
  },
];

const BY_ID = new Map(REGISTRY.map((e) => [e.id, e]));

export function getRegistryEntry(id: string): IntegrationRegistryEntry | undefined {
  if (id === 'mock') return BY_ID.get('mock_finance');
  return BY_ID.get(id as IntegrationRegistryId);
}

export function listRegistryEntries(): IntegrationRegistryEntry[] {
  return [...REGISTRY];
}

export function isDevBuild(): boolean {
  return Boolean(import.meta.env.DEV);
}

/** Entries visible on the integrations hub (respects hidden / dev-only). */
export function listHubIntegrations(options?: {
  scope?: ConnectionsScope;
  includeDevOnly?: boolean;
}): IntegrationRegistryEntry[] {
  const scope = options?.scope;
  const includeDev = options?.includeDevOnly ?? isDevBuild();

  return REGISTRY.filter((e) => {
    if (e.lifecycleStatus === 'hidden') return false;
    if (e.devOnly && !includeDev) return false;
    if (scope === 'invoicing') return e.subCategory === 'finance_invoicing';
    if (scope === 'payments') return e.subCategory === 'finance_payments';
    return true;
  });
}

export function hubEntriesByCategory(
  scope?: ConnectionsScope,
): Map<IntegrationCategory | 'leads_forms', IntegrationRegistryEntry[]> {
  const entries = listHubIntegrations({ scope });
  const map = new Map<IntegrationCategory | 'leads_forms', IntegrationRegistryEntry[]>();
  for (const cat of HUB_CATEGORY_ORDER) {
    const list = entries.filter((e) => e.category === cat);
    if (list.length > 0) map.set(cat, list);
  }
  return map;
}

export function canInitiateHubApiConnect(entry: IntegrationRegistryEntry): boolean {
  if (entry.hubConnectMode !== 'api') return false;
  if (entry.lifecycleStatus === 'coming_soon' || entry.lifecycleStatus === 'hidden') return false;
  if (entry.devOnly && !isDevBuild()) return false;
  return entry.lifecycleStatus === 'live' || (entry.lifecycleStatus === 'beta' && entry.devOnly === true);
}

export function allowsLocalConnectFallback(providerId: string): boolean {
  return providerId === 'mock_finance' || providerId === 'mock';
}

/** Finance connection counts for invoicing UX (Morning + dev mock). */
export function isInvoicingProviderId(providerId: string): boolean {
  const entry = getRegistryEntry(providerId);
  if (!entry || entry.subCategory !== 'finance_invoicing') return false;
  if (entry.lifecycleStatus === 'live') return true;
  if (entry.devOnly && entry.lifecycleStatus === 'beta' && isDevBuild()) return true;
  return false;
}

export function hubStatusLabel(entry: IntegrationRegistryEntry, opts: {
  apiConnected?: boolean;
  routeConnected?: boolean;
  staleLegacyConnection?: boolean;
}): string {
  if (opts.staleLegacyConnection) return 'נדרש ניתוק';
  if (entry.lifecycleStatus === 'coming_soon') return 'בקרוב';
  if (entry.hubConnectMode === 'route') {
    return opts.routeConnected ? 'מחובר' : 'זמין לחיבור';
  }
  if (entry.hubConnectMode === 'api') {
    if (opts.apiConnected) return 'מחובר';
    if (entry.lifecycleStatus === 'live' || (entry.devOnly && isDevBuild())) return 'זמין לחיבור';
  }
  return 'בקרוב';
}

export function connectionCountsAsHubConnected(
  entry: IntegrationRegistryEntry,
  conn?: { status?: string; providerId?: string },
): boolean {
  if (!conn || entry.hubConnectMode !== 'api') return false;
  if (!canInitiateHubApiConnect(entry) && entry.lifecycleStatus !== 'live') return false;
  const ok =
    conn.status === 'connected' ||
    conn.status === 'mock' ||
    conn.status === 'sandbox';
  return ok && isInvoicingProviderId(conn.providerId ?? entry.id);
}

export function registryToCatalogCategory(
  entry: IntegrationRegistryEntry,
): IntegrationCategory {
  if (entry.category === 'leads_forms') return 'leads';
  return entry.category;
}
