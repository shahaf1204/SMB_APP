import { encryptToken } from '../../core/supabase.server';
import type { IntegrationLog } from './financeProvider.interface';

export interface StoredCredentials {
  connectionId: string;
  businessId: string;
  providerId: string;
  apiKeyEncrypted?: string;
  apiBaseUrl?: string;
  accessTokenEncrypted?: string;
  refreshTokenEncrypted?: string;
  expiresAt?: string;
}

const memoryStore = new Map<string, StoredCredentials>();
const processedWebhooks = new Set<string>();
export const integrationLogs: IntegrationLog[] = [];

export function storeCredentials(row: StoredCredentials): void {
  memoryStore.set(row.connectionId, row);
}

export function getCredentials(connectionId: string): StoredCredentials | null {
  return memoryStore.get(connectionId) ?? null;
}

export function deleteCredentials(connectionId: string): void {
  memoryStore.delete(connectionId);
}

export function encryptApiKey(apiKey: string): string {
  return encryptToken(apiKey);
}

export function decryptApiKey(encrypted: string): string {
  return Buffer.from(encrypted, 'base64').toString('utf8');
}

export function appendIntegrationLog(log: IntegrationLog): void {
  integrationLogs.unshift(log);
  if (integrationLogs.length > 200) integrationLogs.pop();
}

export function getIntegrationLogs(businessId: string, limit = 50): IntegrationLog[] {
  return integrationLogs.filter((l) => l.businessId === businessId).slice(0, limit);
}

export function markWebhookProcessed(key: string): boolean {
  if (processedWebhooks.has(key)) return false;
  processedWebhooks.add(key);
  return true;
}

/** @deprecated use integrationLogs */
export const webhookEventLog: Array<{
  id: string;
  provider: string;
  externalEventId: string;
  receivedAt: string;
  rawPayload: unknown;
}> = [];
