import type { Business, Category } from '../../../types/models';
import type { LeadConversionDraft } from './types';
import type { LeadConversionTargetModel } from './types';
import {
  draftValuePresent,
  resolveConversionRequirements,
} from './resolveConversionRequirements';

export type ConversionFieldKey =
  | 'client_name'
  | 'title'
  | 'activity_date'
  | 'activity_time'
  | 'location'
  | 'start_date';

export type ConversionRequirementPurpose =
  | 'conversion_blocking'
  | 'helpful_optional';

export interface ConversionFieldRequirement {
  fieldKey: ConversionFieldKey;
  labelHe: string;
  purpose: ConversionRequirementPurpose;
  /** Show in owner conversion form even when not blocking confirm. */
  showInConversionForm?: boolean;
}

export interface ConversionCompletenessSnapshot {
  requirements: ConversionFieldRequirement[];
  missingFieldKeys: ConversionFieldKey[];
  readyToConfirm: boolean;
}

export interface ConversionCompletenessContext {
  business: Business;
  categories: Category[];
}

export function buildConversionRequirements(
  target: LeadConversionTargetModel,
  context: ConversionCompletenessContext,
): ConversionFieldRequirement[] {
  return resolveConversionRequirements({
    business: context.business,
    targetModel: target,
    categories: context.categories,
  });
}

export function evaluateConversionCompleteness(
  draft: LeadConversionDraft,
  target: LeadConversionTargetModel,
  context: ConversionCompletenessContext,
): ConversionCompletenessSnapshot {
  const requirements = buildConversionRequirements(target, context);
  const blocking = requirements.filter((r) => r.purpose === 'conversion_blocking');
  const missingFieldKeys = blocking
    .map((r) => r.fieldKey)
    .filter((k) => !draftValuePresent(draft, k));

  return {
    requirements,
    missingFieldKeys,
    readyToConfirm: missingFieldKeys.length === 0,
  };
}

export function missingConversionLabels(snapshot: ConversionCompletenessSnapshot): string[] {
  const byKey = new Map(
    snapshot.requirements
      .filter((r) => r.purpose === 'conversion_blocking')
      .map((r) => [r.fieldKey, r.labelHe]),
  );
  return snapshot.missingFieldKeys.map((k) => byKey.get(k) ?? k);
}
