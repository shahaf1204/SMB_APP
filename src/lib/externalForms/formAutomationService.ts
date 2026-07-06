import type {
  ExternalFormConnection,
  ExternalFormSubmission,
  NormalizedFormPayload,
} from '../../types/externalForms';
import type { Category, Event, EventValue, Lead } from '../../types/models';
import {
  buildEventFromSubmission,
  buildEventValuesForSubmission,
  findExistingClientKey,
} from './processSubmission';
import { SPRINT_REQUIRED_APP_FIELDS } from './sprintMapping';
import { appFieldLabel } from './fieldMapping';

export interface ValidationResult {
  valid: boolean;
  missingFields: string[];
}

export function validateSubmissionPayload(
  normalized: NormalizedFormPayload,
): ValidationResult {
  const missingFields: string[] = [];
  for (const field of SPRINT_REQUIRED_APP_FIELDS) {
    const value = normalized.fields[field]?.trim();
    if (!value) missingFields.push(appFieldLabel(field));
  }
  return { valid: missingFields.length === 0, missingFields };
}

export function logAutomationError(context: string, detail: string): void {
  console.error(`[external-forms] ${context}: ${detail}`);
}

export interface CreateActivityFromFormInput {
  connection: ExternalFormConnection;
  submission: Pick<
    ExternalFormSubmission,
    'id' | 'rawPayload' | 'normalizedPayload' | 'externalSubmissionId'
  >;
  categories: Category[];
  events: Event[];
  leads: Lead[];
  businessId: string;
  userId: string;
}

export interface PreparedActivityFromForm {
  event: ReturnType<typeof buildEventFromSubmission>['event'];
  values: EventValue[];
  clientKey?: string;
  reusedClient: boolean;
}

export function prepareActivityFromFormSubmission(
  input: CreateActivityFromFormInput,
): PreparedActivityFromForm {
  const validation = validateSubmissionPayload(input.submission.normalizedPayload);
  if (!validation.valid) {
    const msg = `Missing required fields: ${validation.missingFields.join(', ')}`;
    logAutomationError('validation', msg);
    throw new Error(msg);
  }

  const { clientKey, reusedClient } = resolveClientKey(
    input.events,
    input.leads,
    input.submission.normalizedPayload,
  );

  const { event, categoryInputs } = buildEventFromSubmission(input);
  const values = buildEventValuesForSubmission(
    '',
    input.businessId,
    input.userId,
    input.categories,
    categoryInputs,
  );

  return { event, values, clientKey, reusedClient };
}

function resolveClientKey(
  events: Event[],
  leads: Lead[],
  normalized: NormalizedFormPayload,
): { clientKey?: string; reusedClient: boolean } {
  const f = normalized.fields;
  const existing = findExistingClientKey(
    events,
    leads,
    f.clientPhone,
    f.clientEmail,
    f.clientName,
  );
  return { clientKey: existing, reusedClient: Boolean(existing) };
}
