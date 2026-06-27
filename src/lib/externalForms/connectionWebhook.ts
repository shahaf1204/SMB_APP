import type {
  ExternalFormConnection,
  ExternalFormFieldMapping,
  NormalizedFormPayload,
} from '../../types/externalForms';
import { getExternalFormProvider } from '../../formsProviders';

export function generateSecretKey(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

export function buildWebhookUrl(connectionId: string, secretKey: string, origin?: string): string {
  const base =
    origin ??
    (typeof window !== 'undefined' ? window.location.origin : 'https://smb-app-gray.vercel.app');
  return `${base}/api/webhooks/forms/${connectionId}?secret=${encodeURIComponent(secretKey)}`;
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
