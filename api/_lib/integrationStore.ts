import { encryptToken } from './supabaseAdmin';

export interface StoredCredentials {
  connectionId: string;
  businessId: string;
  provider: string;
  apiKeyEncrypted?: string;
  accessTokenEncrypted?: string;
  refreshTokenEncrypted?: string;
  expiresAt?: string;
}

/** Dev fallback when Supabase unavailable */
const memoryStore = new Map<string, StoredCredentials>();

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

/** Webhook deduplication — in-memory; replace with DB in production */
const processedWebhooks = new Set<string>();

export function markWebhookProcessed(key: string): boolean {
  if (processedWebhooks.has(key)) return false;
  processedWebhooks.add(key);
  return true;
}

export const webhookEventLog: Array<{
  id: string;
  provider: string;
  externalEventId: string;
  receivedAt: string;
  rawPayload: unknown;
}> = [];
