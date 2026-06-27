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
    const val = rawFields[externalField]?.trim();
    if (val) {
      fields[appField as keyof typeof fields] = val;
      mappedKeys.add(externalField);
    }
  }

  const unmapped: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawFields)) {
    if (!mappedKeys.has(key) && value.trim()) unmapped[key] = value.trim();
  }

  return {
    externalSubmissionId,
    fields: fields as NormalizedFormPayload['fields'],
    unmapped,
    submittedAt,
    sourceProvider: provider,
  };
}
