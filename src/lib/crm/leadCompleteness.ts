import type {
  LeadCompletenessRequirementPurpose,
  LeadCompletenessSnapshot,
} from '../../types/leadCompleteness';
import type { OperatingModel } from '../../types/operatingModel';

/** Minimal lead fields for completeness — avoids importing full models (workspace/UI graph). */
export interface LeadCompletenessInput {
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  serviceInterest?: string;
  formAnswers?: Array<{ field: string; value: string }>;
}

export interface LeadCompletenessContext {
  primaryOperatingModel?: OperatingModel;
}

const CONTACT_FIELD = 'contact_method';
const NAME_FIELD = 'client_name';
const REQUEST_FIELD = 'request_context';
const DATE_FIELD = 'activity_date';
const TIME_FIELD = 'activity_time';
const LOCATION_FIELD = 'location';
const SERVICE_FIELD = 'service_interest';

const FORM_LABEL_TO_KEY: Array<{ patterns: RegExp; key: string }> = [
  { patterns: /תאריך|date|event date/i, key: DATE_FIELD },
  { patterns: /שעה|time|event time/i, key: TIME_FIELD },
  { patterns: /מיקום|location|venue|כתובת/i, key: LOCATION_FIELD },
  { patterns: /שירות|service|interest|message|הערות|סוג|טיפול|birthday|יום הולדת/i, key: SERVICE_FIELD },
];

type RequirementDef = {
  fieldKey: string;
  labelHe: string;
  purpose: LeadCompletenessRequirementPurpose;
};

function valueFromFormAnswers(lead: LeadCompletenessInput, fieldKey: string): string | undefined {
  for (const a of lead.formAnswers ?? []) {
    const label = a.field?.trim() ?? '';
    const val = a.value?.trim() ?? '';
    if (!label || !val) continue;
    for (const { patterns, key } of FORM_LABEL_TO_KEY) {
      if (key === fieldKey && patterns.test(label)) return val;
    }
  }
  return undefined;
}

function hasContact(lead: LeadCompletenessInput): boolean {
  return Boolean(lead.phone?.replace(/\D/g, '') || lead.email?.trim());
}

function hasName(lead: LeadCompletenessInput): boolean {
  const n = lead.name?.trim() ?? '';
  return n.length > 0 && n !== 'ללא שם';
}

function hasRequestContext(lead: LeadCompletenessInput): boolean {
  if (lead.serviceInterest?.trim()) return true;
  if (valueFromFormAnswers(lead, SERVICE_FIELD)) return true;
  const notes = lead.notes?.trim() ?? '';
  if (notes.length >= 8) return true;
  return (lead.formAnswers ?? []).some((a) => a.value?.trim());
}

function hasDate(lead: LeadCompletenessInput): boolean {
  return Boolean(valueFromFormAnswers(lead, DATE_FIELD));
}

function hasTime(lead: LeadCompletenessInput): boolean {
  return Boolean(valueFromFormAnswers(lead, TIME_FIELD));
}

function hasLocation(lead: LeadCompletenessInput): boolean {
  return Boolean(valueFromFormAnswers(lead, LOCATION_FIELD));
}

function modelWantsScheduling(model?: OperatingModel): boolean {
  return model === 'event' || model === 'appointment' || model === 'hybrid';
}

/** Builds requirement set — extensible via future business rules registry. */
export function buildCompletenessRequirements(ctx: LeadCompletenessContext): RequirementDef[] {
  const reqs: RequirementDef[] = [
    { fieldKey: NAME_FIELD, labelHe: 'שם הלקוח/ה', purpose: 'review_blocking' },
    { fieldKey: CONTACT_FIELD, labelHe: 'טלפון או אימייל', purpose: 'review_blocking' },
    { fieldKey: REQUEST_FIELD, labelHe: 'פרטי הבקשה / הקשר', purpose: 'review_blocking' },
  ];

  if (modelWantsScheduling(ctx.primaryOperatingModel)) {
    reqs.push(
      { fieldKey: DATE_FIELD, labelHe: 'תאריך', purpose: 'conversion_blocking' },
      { fieldKey: TIME_FIELD, labelHe: 'שעה', purpose: 'conversion_blocking' },
      { fieldKey: LOCATION_FIELD, labelHe: 'מיקום', purpose: 'conversion_blocking' },
    );
  }

  return reqs;
}

function isPresent(lead: LeadCompletenessInput, fieldKey: string): boolean {
  switch (fieldKey) {
    case NAME_FIELD:
      return hasName(lead);
    case CONTACT_FIELD:
      return hasContact(lead);
    case REQUEST_FIELD:
    case SERVICE_FIELD:
      return hasRequestContext(lead);
    case DATE_FIELD:
      return hasDate(lead);
    case TIME_FIELD:
      return hasTime(lead);
    case LOCATION_FIELD:
      return hasLocation(lead);
    default:
      return false;
  }
}

export function evaluateLeadCompleteness(
  lead: LeadCompletenessInput,
  ctx: LeadCompletenessContext = {},
): LeadCompletenessSnapshot {
  const requirements = buildCompletenessRequirements(ctx).map((r) => ({
    ...r,
    requiredForReview: r.purpose === 'review_blocking',
  }));
  const presentFieldKeys: string[] = [];
  const missingFieldKeys: string[] = [];
  const missingReviewFieldKeys: string[] = [];
  const missingConversionFieldKeys: string[] = [];

  for (const req of requirements) {
    if (isPresent(lead, req.fieldKey)) {
      presentFieldKeys.push(req.fieldKey);
    } else {
      missingFieldKeys.push(req.fieldKey);
      if (req.purpose === 'review_blocking') missingReviewFieldKeys.push(req.fieldKey);
      if (req.purpose === 'conversion_blocking') missingConversionFieldKeys.push(req.fieldKey);
    }
  }

  return {
    requirements,
    presentFieldKeys,
    missingFieldKeys,
    missingReviewFieldKeys,
    missingConversionFieldKeys,
    readyForReview: missingReviewFieldKeys.length === 0,
    evaluatedAt: new Date().toISOString(),
  };
}

export function intakeStatusFromCompleteness(
  snapshot: LeadCompletenessSnapshot,
): 'needs_information' | 'ready_for_review' {
  return snapshot.readyForReview ? 'ready_for_review' : 'needs_information';
}
