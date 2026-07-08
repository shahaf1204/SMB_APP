import type { ExternalFormFieldMapping } from './externalForms.types';
import {
  applyFieldMapping,
  extractFormsAppFields,
  extractSubmissionId,
  flattenPayloadFields,
} from './externalForms.mapper';

function pickSubmittedAt(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const p = payload as Record<string, unknown>;
  const raw = p.submitted_at ?? p.submittedAt ?? p.created_at ?? p.createdAt;
  return typeof raw === 'string' ? raw : undefined;
}

export interface NormalizedFormsAppPayload {
  externalSubmissionId?: string;
  submittedAt?: string;
  fields: Record<string, string>;
  unmapped: Record<string, string>;
  rawFields: Record<string, string>;
}

/** Normalize real Forms.app webhook payloads — no mock data. */
export function normalizeFormsAppPayload(
  payload: unknown,
  fieldMapping: ExternalFormFieldMapping[] = [],
): NormalizedFormsAppPayload {
  const externalSubmissionId = extractSubmissionId(payload);
  const submittedAt = pickSubmittedAt(payload);
  const rawFields = extractFormsAppFields(payload);
  const { fields, unmapped } = applyFieldMapping(rawFields, fieldMapping);

  return {
    externalSubmissionId,
    submittedAt,
    fields,
    unmapped,
    rawFields,
  };
}

export function extractFormsAppFieldKeys(payload: unknown): string[] {
  return Object.keys(extractFormsAppFields(payload));
}

export function flattenFormsAppPayload(payload: unknown): Record<string, string> {
  return flattenPayloadFields(payload);
}
