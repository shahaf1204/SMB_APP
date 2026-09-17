import { resolveActivityFormSchema } from '../../activityForm/resolveActivityFormSchema';
import type { ActivityFormFieldPresentation } from '../../activityForm/types';
import type { Business, Category } from '../../../types/models';
import type { OperatingModel } from '../../../types/operatingModel';
import type { LeadConversionDraft } from './types';
import type { LeadConversionTargetModel } from './types';
import type { ConversionFieldKey, ConversionFieldRequirement } from './leadConversionCompleteness';

export interface ResolveConversionRequirementsInput {
  business: Business;
  targetModel: LeadConversionTargetModel;
  categories: Category[];
}

const UNIVERSAL_BLOCKING: ConversionFieldRequirement[] = [
  { fieldKey: 'client_name', labelHe: 'שם הלקוח/ה', purpose: 'conversion_blocking' },
  { fieldKey: 'title', labelHe: 'שם הפעילות / הבקשה', purpose: 'conversion_blocking' },
];

/** Maps activity schema field keys to conversion draft keys (internal only). */
function schemaKeyToConversionKey(
  field: ActivityFormFieldPresentation,
  targetModel: LeadConversionTargetModel,
): ConversionFieldKey | null {
  if (field.builtin === 'title' || field.key === '__builtin_title') return 'title';
  if (field.builtin === 'date' || field.key === '__builtin_date') {
    return schedulingTarget(targetModel) ? 'activity_date' : 'start_date';
  }
  if (field.builtin === 'location' || field.key === '__builtin_location') return 'location';
  if (field.key === 'event_start_time' || field.key === 'appt_time') return 'activity_time';
  if (
    field.key === 'journey_start' ||
    field.key === 'project_start' ||
    field.key === 'recurring_start' ||
    field.key === 'purchase_date'
  ) {
    return 'start_date';
  }
  if (isClientField(field)) return 'client_name';
  return null;
}

function isClientField(field: ActivityFormFieldPresentation): boolean {
  return field.section === 'client' && field.priority === 'core';
}

function schedulingTarget(target: LeadConversionTargetModel): boolean {
  return target === 'event' || target === 'appointment';
}

function operatingModelForTarget(target: LeadConversionTargetModel): OperatingModel {
  return target;
}

/**
 * Central resolver for conversion completeness and missing-information UI (Phase 3A.7 reuse).
 * Uses activity form schema when categories/workspace are available; documented fallbacks otherwise.
 */
export function resolveConversionRequirements(
  input: ResolveConversionRequirementsInput,
): ConversionFieldRequirement[] {
  const { business, targetModel, categories } = input;
  const operatingModel = operatingModelForTarget(targetModel);
  const businessType = business.presetId ?? business.workspace?.businessType;

  const schema = resolveActivityFormSchema({
    businessType,
    operatingModel,
    categories,
  });

  const blocking = new Map<ConversionFieldKey, ConversionFieldRequirement>();
  for (const req of UNIVERSAL_BLOCKING) {
    blocking.set(req.fieldKey, req);
  }

  for (const field of schema.fields) {
    const draftKey = schemaKeyToConversionKey(field, targetModel);
    if (!draftKey) continue;

    if (field.required) {
      blocking.set(draftKey, {
        fieldKey: draftKey,
        labelHe: field.label,
        purpose: 'conversion_blocking',
      });
      continue;
    }

    if (
      schedulingTarget(targetModel) &&
      (draftKey === 'activity_time' || draftKey === 'location') &&
      (field.priority === 'primary' || field.visibleByDefault)
    ) {
      if (!blocking.has(draftKey)) {
        blocking.set(draftKey, {
          fieldKey: draftKey,
          labelHe: field.label,
          purpose: 'helpful_optional',
          showInConversionForm: true,
        });
      }
    }
  }

  if (!schedulingTarget(targetModel) && !blocking.has('start_date')) {
    blocking.set('start_date', {
      fieldKey: 'start_date',
      labelHe: 'תאריך התחלה',
      purpose: 'conversion_blocking',
    });
  }

  if (schedulingTarget(targetModel) && !blocking.has('activity_date')) {
    blocking.set('activity_date', {
      fieldKey: 'activity_date',
      labelHe: 'תאריך',
      purpose: 'conversion_blocking',
    });
  }

  const order: ConversionFieldKey[] = [
    'client_name',
    'title',
    'activity_date',
    'activity_time',
    'location',
    'start_date',
  ];

  return order
    .map((k) => blocking.get(k))
    .filter(Boolean) as ConversionFieldRequirement[];
}

export function draftValuePresent(draft: LeadConversionDraft, key: ConversionFieldKey): boolean {
  switch (key) {
    case 'client_name':
      return Boolean(draft.clientName?.trim());
    case 'title':
      return Boolean(draft.title?.trim());
    case 'activity_date':
      return Boolean(draft.activityDate?.trim());
    case 'activity_time':
      return Boolean(draft.activityTime?.trim());
    case 'location':
      return Boolean(draft.location?.trim());
    case 'start_date':
      return Boolean(draft.activityDate?.trim());
    default:
      return false;
  }
}

export function conversionFormFieldKeys(requirements: ConversionFieldRequirement[]): ConversionFieldKey[] {
  const keys = new Set<ConversionFieldKey>();
  for (const r of requirements) {
    if (r.purpose === 'conversion_blocking' || r.showInConversionForm) {
      keys.add(r.fieldKey);
    }
  }
  return [
    'client_name',
    'title',
    'activity_date',
    'activity_time',
    'location',
    'start_date',
  ].filter((k) => keys.has(k as ConversionFieldKey)) as ConversionFieldKey[];
}
