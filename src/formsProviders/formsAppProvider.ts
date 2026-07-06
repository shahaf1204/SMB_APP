import {
  applyMappingToFields,
  flattenPayloadFields,
  type ExternalFormProvider,
} from './formsProvider';

function pickSubmissionId(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const p = payload as Record<string, unknown>;
  const nested = p.submission;
  if (nested && typeof nested === 'object') {
    const fromNested = pickSubmissionId(nested);
    if (fromNested) return fromNested;
  }
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

function extractFieldArray(items: unknown[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const key =
      row.name ?? row.label ?? row.title ?? row.question ?? row.key ?? row.id ?? row.field;
    const val = row.value ?? row.answer ?? row.text ?? row.content;
    if (key != null && val != null) out[String(key)] = String(val);
  }
  return out;
}

/** forms.app: { data }, { fields }, { answers }, nested submission, or field arrays */
function extractFormsAppFields(payload: unknown): Record<string, string> {
  if (!payload || typeof payload !== 'object') {
    return flattenPayloadFields(payload);
  }
  const p = payload as Record<string, unknown>;
  const out: Record<string, string> = {};

  const merge = (source: unknown) => Object.assign(out, flattenPayloadFields(source));

  if (p.submission && typeof p.submission === 'object') {
    merge(p.submission);
    const sub = p.submission as Record<string, unknown>;
    if (sub.data) merge(sub.data);
    if (sub.fields) merge(sub.fields);
    if (sub.answers) merge(sub.answers);
  }
  if (p.data && typeof p.data === 'object') merge(p.data);
  if (p.fields && typeof p.fields === 'object') {
    if (Array.isArray(p.fields)) Object.assign(out, extractFieldArray(p.fields));
    else merge(p.fields);
  }
  if (p.answers && typeof p.answers === 'object') {
    if (Array.isArray(p.answers)) Object.assign(out, extractFieldArray(p.answers));
    else merge(p.answers);
  }

  if (Object.keys(out).length === 0) merge(payload);
  return out;
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
