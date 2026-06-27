import type { NormalizedFormPayload } from '../types/externalForms';
import {
  applyMappingToFields,
  flattenPayloadFields,
  type ExternalFormProvider,
} from './formsProvider';

function pickSubmissionId(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const p = payload as Record<string, unknown>;
  for (const key of ['submission_id', 'submissionId', 'id', 'response_id', 'event_id']) {
    const v = p[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

export const customWebhookProvider: ExternalFormProvider = {
  providerName: 'custom',

  extractSubmissionId: pickSubmissionId,

  extractFields(payload) {
    return flattenPayloadFields(payload);
  },

  normalizePayload(payload, fieldMapping = []) {
    const rawFields = flattenPayloadFields(payload);
    return applyMappingToFields(
      rawFields,
      fieldMapping,
      'custom',
      pickSubmissionId(payload),
      typeof (payload as { submitted_at?: string })?.submitted_at === 'string'
        ? (payload as { submitted_at: string }).submitted_at
        : undefined,
    );
  },
};

/** TODO: native Google Forms API + Apps Script bridge */
export const googleFormsProvider: ExternalFormProvider = {
  ...customWebhookProvider,
  providerName: 'google_forms',
  normalizePayload(payload, fieldMapping = []) {
    const result = customWebhookProvider.normalizePayload(payload, fieldMapping);
    return { ...result, sourceProvider: 'google_forms' };
  },
};

/** TODO: Typeform native webhooks */
export const typeformProvider: ExternalFormProvider = {
  ...customWebhookProvider,
  providerName: 'typeform',
  normalizePayload(payload, fieldMapping = []) {
    const result = customWebhookProvider.normalizePayload(payload, fieldMapping);
    return { ...result, sourceProvider: 'typeform' };
  },
};

/** TODO: Jotform native webhooks */
export const jotformProvider: ExternalFormProvider = {
  ...customWebhookProvider,
  providerName: 'jotform',
  normalizePayload(payload, fieldMapping = []) {
    const result = customWebhookProvider.normalizePayload(payload, fieldMapping);
    return { ...result, sourceProvider: 'jotform' };
  },
};

/** TODO: Tally native webhooks */
export const tallyProvider: ExternalFormProvider = {
  ...customWebhookProvider,
  providerName: 'tally',
  normalizePayload(payload, fieldMapping = []) {
    const result = customWebhookProvider.normalizePayload(payload, fieldMapping);
    return { ...result, sourceProvider: 'tally' };
  },
};

export type { NormalizedFormPayload };
