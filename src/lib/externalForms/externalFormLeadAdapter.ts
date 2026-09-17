/**
 * Phase 3A.6 foundation — external form → normalized Lead payload.
 * Default form automation still creates Events (see 3A.6.1 migration).
 */
import type { ExternalFormConnection, NormalizedFormPayload } from '../../types/externalForms';
import type { LeadFormAnswer } from '../../types/models';
import type { ExternalLeadPayload } from '../crm/createLeadFromExternalSource';

export function buildLeadPayloadFromExternalForm(input: {
  connection: ExternalFormConnection;
  normalized: NormalizedFormPayload;
  businessId: string;
  userId: string;
  externalSubmissionId?: string;
}): ExternalLeadPayload {
  const f = input.normalized.fields;
  const formAnswers: LeadFormAnswer[] = Object.entries(f)
    .filter(([, v]) => v?.trim())
    .map(([field, value]) => ({ field, value: value ?? '' }));

  return {
    businessId: input.businessId,
    userId: input.userId,
    fullName: f.clientName?.trim() || 'ללא שם',
    phone: f.clientPhone?.trim(),
    email: f.clientEmail?.trim(),
    source: 'website',
    serviceInterest: f.activityTitle?.trim() || input.connection.formName,
    notes: f.notes?.trim() || `פנייה מטופס: ${input.connection.formName}`,
    externalProvider: 'website',
    externalLeadId: input.externalSubmissionId,
    externalFormId: input.connection.id,
    externalFormName: input.connection.formName,
    formAnswers,
  };
}
