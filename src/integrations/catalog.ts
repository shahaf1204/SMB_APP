import type { ProviderCatalogEntry, ProviderId } from '../types/integrations';
import {
  getRegistryEntry,
  listHubIntegrations,
  listRegistryEntries,
  registryToCatalogCategory,
  type IntegrationRegistryEntry,
} from './integrationRegistry';

function entryToCatalog(entry: IntegrationRegistryEntry): ProviderCatalogEntry {
  const comingSoon = entry.lifecycleStatus === 'coming_soon';
  const available =
    entry.lifecycleStatus === 'live' ||
    (entry.lifecycleStatus === 'beta' && entry.hubConnectMode === 'api');
  return {
    id: entry.id as ProviderId,
    category: registryToCatalogCategory(entry),
    name: entry.displayName,
    nameHe: entry.nameHe,
    description: entry.description,
    authMethod: entry.authType,
    logoEmoji: entry.logoEmoji,
    brandColor: entry.brandColor,
    available: available && entry.hubConnectMode !== 'none',
    comingSoon,
    connectSteps: entry.connectSteps,
    credentialFields: entry.credentialFields,
    mockConnect: entry.id === 'mock_finance',
    registry: entry,
  };
}

/** @deprecated Prefer `getRegistryEntry` / `listHubIntegrations` — kept for invoice labels & legacy callers. */
export const INTEGRATION_CATALOG: ProviderCatalogEntry[] = listRegistryEntries()
  .filter((e) => e.lifecycleStatus !== 'hidden')
  .map(entryToCatalog);

export const CATEGORY_LABELS: Record<string, string> = {
  finance: 'כספים — חשבוניות וסליקה',
  leads: 'לידים',
  calendar: 'יומן',
  communication: 'תקשורת',
  marketing: 'שיווק ולידים',
};

export function getCatalogEntry(providerId: string): ProviderCatalogEntry | undefined {
  if (providerId === 'mock') return getCatalogEntry('mock_finance');
  const reg = getRegistryEntry(providerId);
  if (!reg || reg.lifecycleStatus === 'hidden') return undefined;
  return entryToCatalog(reg);
}

export function catalogByCategory(category: string): ProviderCatalogEntry[] {
  if (category === 'leads') {
    return INTEGRATION_CATALOG.filter((p) => p.category === 'leads' || p.category === 'marketing');
  }
  return INTEGRATION_CATALOG.filter((p) => p.category === category);
}

/** Featured providers for integrations hub */
export const FEATURED_PROVIDER_IDS = [
  'morning',
  'meta_leads',
  'forms_app',
  'google_calendar',
] as const;

export { entryToCatalog, listHubIntegrations };
