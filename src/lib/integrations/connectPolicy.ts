import {
  allowsLocalConnectFallback,
  canInitiateHubApiConnect,
  getRegistryEntry,
} from '../../integrations/integrationRegistry';
import type { ProviderId } from '../../types/integrations';

export function assertCanConnectProvider(provider: ProviderId): void {
  const entry = getRegistryEntry(provider);
  if (!entry) {
    throw new Error('ספק לא מוכר');
  }
  if (!canInitiateHubApiConnect(entry)) {
    if (entry.lifecycleStatus === 'coming_soon') {
      throw new Error('החיבור עדיין לא זמין — בקרוב');
    }
    if (entry.hubConnectMode === 'route') {
      throw new Error('החיבור מתבצע במסך ייעודי — חזרו למקורות הכניסה');
    }
    throw new Error('לא ניתן להתחבר לספק זה מהמסך הזה');
  }
}

export function shouldUseLocalConnectFallback(provider: ProviderId, apiFailed: boolean): boolean {
  if (!apiFailed) return false;
  return allowsLocalConnectFallback(provider);
}
