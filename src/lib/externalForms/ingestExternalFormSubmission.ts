import type { ExternalFormConnection, NormalizedFormPayload } from '../../types/externalForms';
import type { Lead } from '../../types/models';
import type { OperatingModel } from '../../types/operatingModel';
import { createLeadFromExternalSource } from '../crm/createLeadFromExternalSource';
import { buildLeadPayloadFromExternalForm } from './externalFormLeadAdapter';

export interface LeadIngestValidationResult {
  valid: boolean;
  missingFields: string[];
}

/** Minimum identity for Lead-first intake — not the old Event sprint checklist. */
export function validateLeadIngestPayload(normalized: NormalizedFormPayload): LeadIngestValidationResult {
  const f = normalized.fields;
  const hasName = Boolean(f.clientName?.trim() || f.childName?.trim());
  const hasTitle = Boolean(f.activityTitle?.trim());
  if (!hasName && !hasTitle) {
    return { valid: false, missingFields: ['שם לקוח או שם פעילות'] };
  }
  return { valid: true, missingFields: [] };
}

export interface IngestExternalFormLeadInput {
  connection: ExternalFormConnection;
  normalized: NormalizedFormPayload;
  submissionId: string;
  businessId: string;
  userId: string;
  existingLeads: Lead[];
  primaryOperatingModel?: OperatingModel;
  rawPayload?: unknown;
  externalSubmissionId?: string;
}

export interface IngestExternalFormLeadResult {
  lead: Lead;
  created: boolean;
  externalLeadId: string;
}

/** Shared boundary: normalized form submission → Lead + intake (no Activity). */
export function ingestExternalFormLead(
  input: IngestExternalFormLeadInput,
): IngestExternalFormLeadResult {
  const validation = validateLeadIngestPayload(input.normalized);
  if (!validation.valid) {
    throw new Error(`Missing required fields: ${validation.missingFields.join(', ')}`);
  }

  const payload = buildLeadPayloadFromExternalForm({
    connection: input.connection,
    normalized: input.normalized,
    businessId: input.businessId,
    userId: input.userId,
    submissionId: input.submissionId,
    externalSubmissionId: input.externalSubmissionId,
    rawPayload: input.rawPayload,
  });

  const { lead, created } = createLeadFromExternalSource(payload, input.existingLeads, {
    primaryOperatingModel: input.primaryOperatingModel,
  });

  return {
    lead,
    created,
    externalLeadId: payload.externalLeadId!,
  };
}

export function findExistingLeadIdForFormSubmission(
  leads: Lead[],
  externalLeadId: string,
): string | undefined {
  const match = leads.find(
    (l) => l.externalProvider === 'website' && l.externalLeadId === externalLeadId,
  );
  return match?.id;
}
