import type {
  ExternalFormConnection,
  ExternalFormFieldMapping,
  NormalizedFormPayload,
} from '../../types/externalForms';
import { getExternalFormProvider } from '../../formsProviders';

const PRODUCTION_WEBHOOK_ORIGIN = 'https://smb-app-gray.vercel.app';

export function generateSecretKey(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

/** Always use the stable production origin — preview URLs break forms.app webhooks. */
export function getWebhookOrigin(): string {
  const fromEnv = import.meta.env.VITE_WEBHOOK_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.includes('vercel.app') && !host.startsWith('smb-app-gray')) {
      return PRODUCTION_WEBHOOK_ORIGIN;
    }
    return window.location.origin;
  }

  return PRODUCTION_WEBHOOK_ORIGIN;
}

export function buildWebhookUrl(connectionId: string, secretKey: string, origin?: string): string {
  const base = origin ?? getWebhookOrigin();
  const params = new URLSearchParams({
    connectionId,
    secret: secretKey,
  });
  return `${base}/api/webhooks/forms?${params.toString()}`;
}

export function normalizeSubmission(
  connection: Pick<ExternalFormConnection, 'provider' | 'fieldMapping'>,
  rawPayload: unknown,
): NormalizedFormPayload {
  const provider = getExternalFormProvider(connection.provider);
  return provider.normalizePayload(
    rawPayload,
    connection.fieldMapping as ExternalFormFieldMapping[],
  );
}

export function hashPayload(connectionId: string, rawPayload: unknown): string {
  const text = JSON.stringify(rawPayload ?? {});
  let hash = 0;
  const key = connectionId + text;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return `hash_${connectionId}_${Math.abs(hash)}`;
}

export function detectExternalFields(rawPayload: unknown, provider: ExternalFormConnection['provider']): string[] {
  const p = getExternalFormProvider(provider);
  return Object.keys(p.extractFields(rawPayload)).sort();
}
