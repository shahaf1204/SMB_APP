import type { ExternalFormProviderId, NormalizedFormPayload } from '../types/externalForms';

export interface ExternalFormProvider {
  providerName: ExternalFormProviderId;
  normalizePayload(
    payload: unknown,
    fieldMapping?: { externalField: string; appField: string }[],
  ): NormalizedFormPayload;
  extractSubmissionId(payload: unknown): string | undefined;
  extractFields(payload: unknown): Record<string, string>;
}

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
      if (value != null && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(out, flattenPayloadFields(value, path));
      } else {
        Object.assign(out, flattenPayloadFields(value, path));
      }
    }
  }
  return out;
}

function normalizeFieldKey(key: string): string {
  return key.trim().toLowerCase();
}

function lookupRawField(
  rawFields: Record<string, string>,
  externalField: string,
): string | undefined {
  const direct = rawFields[externalField]?.trim();
  if (direct) return direct;

  const target = normalizeFieldKey(externalField);
  for (const [key, value] of Object.entries(rawFields)) {
    if (normalizeFieldKey(key) === target && value.trim()) return value.trim();
  }
  return undefined;
}

export function applyMappingToFields(
  rawFields: Record<string, string>,
  fieldMapping: { externalField: string; appField: string }[],
  provider: ExternalFormProviderId,
  externalSubmissionId?: string,
  submittedAt?: string,
): NormalizedFormPayload {
  const fields: Partial<Record<string, string>> = {};
  const mappedKeys = new Set<string>();

  for (const { externalField, appField } of fieldMapping) {
    const val = lookupRawField(rawFields, externalField);
    if (val) {
      if (!fields[appField as keyof typeof fields]) {
        fields[appField as keyof typeof fields] = val;
      }
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

  return {
    externalSubmissionId,
    fields: fields as NormalizedFormPayload['fields'],
    unmapped,
    submittedAt,
    sourceProvider: provider,
  };
}
