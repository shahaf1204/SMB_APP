import type { ExternalFormFieldMapping, ExternalFormProviderId } from './externalForms.types';

export function flattenPayloadFields(payload: unknown, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  if (payload == null) return out;

  if (typeof payload === 'string' || typeof payload === 'number' || typeof payload === 'boolean') {
    if (prefix) out[prefix] = String(payload);
    return out;
  }

  if (Array.isArray(payload)) {
    payload.forEach((item, i) => {
      Object.assign(out, flattenPayloadFields(item, prefix ? `${prefix}[${i}]` : String(i)));
    });
    return out;
  }

  if (typeof payload === 'object') {
    for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
      const path = prefix ? `${prefix}.${key}` : key;
      Object.assign(out, flattenPayloadFields(value, path));
    }
  }
  return out;
}

function normalizeFieldKey(key: string): string {
  return key.trim().toLowerCase();
}

function lookupRawField(rawFields: Record<string, string>, externalField: string): string | undefined {
  const direct = rawFields[externalField]?.trim();
  if (direct) return direct;

  const target = normalizeFieldKey(externalField);
  for (const [key, value] of Object.entries(rawFields)) {
    if (normalizeFieldKey(key) === target && value.trim()) return value.trim();
  }
  return undefined;
}

export function applyFieldMapping(
  rawFields: Record<string, string>,
  fieldMapping: ExternalFormFieldMapping[],
): { fields: Record<string, string>; unmapped: Record<string, string> } {
  const fields: Record<string, string> = {};
  const mappedKeys = new Set<string>();

  for (const { externalField, appField } of fieldMapping) {
    const val = lookupRawField(rawFields, externalField);
    if (val) {
      fields[appField] = val;
      mappedKeys.add(externalField);
      for (const [key] of Object.entries(rawFields)) {
        if (normalizeFieldKey(key) === normalizeFieldKey(externalField)) mappedKeys.add(key);
      }
    }
  }

  const unmapped: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawFields)) {
    const used = [...mappedKeys].some((m) => normalizeFieldKey(m) === normalizeFieldKey(key));
    if (!used && value.trim()) unmapped[key] = value.trim();
  }

  return { fields, unmapped };
}

export function extractSubmissionId(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const p = payload as Record<string, unknown>;
  const nested = p.submission;
  if (nested && typeof nested === 'object') {
    const fromNested = extractSubmissionId(nested);
    if (fromNested) return fromNested;
  }
  for (const key of ['submission_id', 'submissionId', 'id', 'response_id', 'responseId']) {
    const v = p[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  return undefined;
}

export function extractGenericFields(payload: unknown): Record<string, string> {
  if (!payload || typeof payload !== 'object') return flattenPayloadFields(payload);
  const p = payload as Record<string, unknown>;
  if (p.data && typeof p.data === 'object') return flattenPayloadFields(p.data);
  if (p.fields && typeof p.fields === 'object') return flattenPayloadFields(p.fields);
  return flattenPayloadFields(payload);
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

export function normalizeWebhookResponse(
  provider: ExternalFormProviderId,
  rawPayload: unknown,
  fieldMapping: ExternalFormFieldMapping[],
): { fields: Record<string, string>; unmapped: Record<string, string> } {
  const rawFields =
    provider === 'forms_app'
      ? extractFormsAppFields(rawPayload)
      : extractGenericFields(rawPayload);
  return applyFieldMapping(rawFields, fieldMapping);
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
export function extractFormsAppFields(payload: unknown): Record<string, string> {
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
