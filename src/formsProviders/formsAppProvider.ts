import {
  applyMappingToFields,
  flattenPayloadFields,
  type ExternalFormProvider,
} from './formsProvider';

function pickSubmissionId(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const p = payload as Record<string, unknown>;
  const candidates = [p.submission_id, p.submissionId, p.id, p.response_id, p.responseId];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
    if (typeof c === 'number') return String(c);
  }
  return undefined;
}

function pickSubmittedAt(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const p = payload as Record<string, unknown>;
  const raw = p.submitted_at ?? p.submittedAt ?? p.created_at ?? p.createdAt;
  return typeof raw === 'string' ? raw : undefined;
}

/** forms.app often sends { data: { field: value } } or flat fields */
function extractFormsAppFields(payload: unknown): Record<string, string> {
  if (!payload || typeof payload !== 'object') {
    return flattenPayloadFields(payload);
  }
  const p = payload as Record<string, unknown>;
  if (p.data && typeof p.data === 'object') {
    return flattenPayloadFields(p.data);
  }
  if (p.fields && typeof p.fields === 'object') {
    return flattenPayloadFields(p.fields);
  }
  if (p.answers && typeof p.answers === 'object') {
    return flattenPayloadFields(p.answers);
  }
  return flattenPayloadFields(payload);
}

export const formsAppProvider: ExternalFormProvider = {
  providerName: 'forms_app',

  extractSubmissionId: pickSubmissionId,

  extractFields: extractFormsAppFields,

  normalizePayload(payload, fieldMapping = []) {
    const externalSubmissionId = pickSubmissionId(payload);
    const submittedAt = pickSubmittedAt(payload);
    const rawFields = extractFormsAppFields(payload);
    return applyMappingToFields(
      rawFields,
      fieldMapping,
      'forms_app',
      externalSubmissionId,
      submittedAt,
    );
  },
};
