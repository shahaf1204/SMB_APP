import {
  applyMappingToFields,
  flattenPayloadFields,
  type ExternalFormProvider,
} from './formsProvider';
import {
  extractFormsAppSubmissionId,
  parseFormsAppNestedPayload,
} from '../lib/externalForms/formsAppPayloadParser';

function pickSubmittedAt(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const p = payload as Record<string, unknown>;
  const answer = p.answer ?? p.Answer;
  if (answer && typeof answer === 'object') {
    const a = answer as Record<string, unknown>;
    const fromAnswer = a.submitted_at ?? a.submittedAt ?? a.created_at ?? a.createdAt;
    if (typeof fromAnswer === 'string') return fromAnswer;
  }
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

/** forms.app: nested form.questions + answer.answers, or flat simulate payloads */
function extractFormsAppFields(payload: unknown): Record<string, string> {
  const nested = parseFormsAppNestedPayload(payload);
  if (Object.keys(nested).length > 0) return nested;

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

  extractSubmissionId: extractFormsAppSubmissionId,

  extractFields: extractFormsAppFields,

  normalizePayload(payload, fieldMapping = []) {
    const externalSubmissionId = extractFormsAppSubmissionId(payload);
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
