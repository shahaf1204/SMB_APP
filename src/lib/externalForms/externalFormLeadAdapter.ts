/**
 * External form → normalized Lead payload (Phase 3A.6 / 3A.6.1).
 * Provider-specific webhook mapping stays upstream; this is provider-neutral Lead input.
 */
import type {
  ExternalFormAppField,
  ExternalFormConnection,
  ExternalFormProviderId,
  NormalizedFormPayload,
} from '../../types/externalForms';
import { EXTERNAL_FORM_PROVIDER_LABELS } from '../../types/externalForms';
import type { LeadFormAnswer, LeadSourceChannel } from '../../types/models';
import type { ExternalLeadPayload } from '../crm/createLeadFromExternalSource';
import { appFieldLabel } from './fieldMapping';

export function resolveStableExternalFormLeadId(input: {
  connectionId: string;
  submissionId: string;
  externalSubmissionId?: string;
}): string {
  const ext = input.externalSubmissionId?.trim();
  if (ext) return ext;
  return `submission:${input.connectionId}:${input.submissionId}`;
}

function leadSourceForFormProvider(provider: ExternalFormProviderId): LeadSourceChannel {
  if (provider === 'google_forms') return 'google';
  return 'website';
}

export function buildFormAnswersFromNormalized(
  normalized: NormalizedFormPayload,
): LeadFormAnswer[] {
  const answers: LeadFormAnswer[] = [];
  for (const [key, value] of Object.entries(normalized.fields)) {
    if (!value?.trim()) continue;
    const label = appFieldLabel(key as ExternalFormAppField);
    answers.push({ field: label, value: value.trim() });
  }
  for (const [field, value] of Object.entries(normalized.unmapped)) {
    if (!value?.trim()) continue;
    answers.push({ field, value: value.trim() });
  }
  return answers;
}

export function buildLeadPayloadFromExternalForm(input: {
  connection: ExternalFormConnection;
  normalized: NormalizedFormPayload;
  businessId: string;
  userId: string;
  submissionId: string;
  externalSubmissionId?: string;
  rawPayload?: unknown;
}): ExternalLeadPayload {
  const f = input.normalized.fields;
  const formAnswers = buildFormAnswersFromNormalized(input.normalized);
  const providerLabel = EXTERNAL_FORM_PROVIDER_LABELS[input.connection.provider];

  const notesParts: string[] = [];
  if (f.notes?.trim()) notesParts.push(f.notes.trim());
  if (f.childName) notesParts.push(`ילד/ה: ${f.childName}`);
  if (f.activityTime) notesParts.push(`שעה: ${f.activityTime}`);
  notesParts.push(`פנייה מטופס: ${input.connection.formName} (${providerLabel})`);

  return {
    businessId: input.businessId,
    userId: input.userId,
    fullName: f.clientName?.trim() || f.childName?.trim() || 'ללא שם',
    phone: f.clientPhone?.trim(),
    email: f.clientEmail?.trim(),
    source: leadSourceForFormProvider(input.connection.provider),
    serviceInterest: f.activityTitle?.trim() || input.connection.formName,
    notes: notesParts.filter(Boolean).join('\n'),
    externalProvider: 'website',
    externalLeadId: resolveStableExternalFormLeadId({
      connectionId: input.connection.id,
      submissionId: input.submissionId,
      externalSubmissionId: input.externalSubmissionId ?? input.normalized.externalSubmissionId,
    }),
    externalFormId: input.connection.id,
    externalFormName: input.connection.formName,
    formAnswers,
    rawPayload: input.rawPayload,
  };
}
