import type { MetricRole, ValueType } from './models';
import type { OperatingModel } from './workspace';

/** Semantic source for category recommendation badges */
export type CategoryTemplateSource =
  | 'core'
  | 'generic'
  | 'business_type'
  | 'operating_model'
  | 'manual';

/** Central template — deduped by `key` */
export interface CategoryTemplate {
  key: string;
  name: string;
  valueType: ValueType;
  metricRole: MetricRole;
  source: CategoryTemplateSource;
  /** Cannot be removed during onboarding */
  isProtected?: boolean;
  /** Shown as required in UI */
  isRequired?: boolean;
  sortPriority?: number;
}

/** Draft category row during onboarding (before business exists) */
export interface OnboardingCategoryDraft {
  key: string;
  name: string;
  valueType: ValueType;
  metricRole: MetricRole;
  source: CategoryTemplateSource;
  isProtected: boolean;
  isRequired: boolean;
  enabled: boolean;
  sortOrder: number;
}

/** How the user chose their primary working style during onboarding step 2 */
export type PrimaryModelSelectionSource = 'none' | 'recommended' | 'manual';

export interface OnboardingDraft {
  version: 1;
  step: 1 | 2 | 3 | 4 | 5;
  name: string;
  mode: 'list' | 'custom';
  presetId: string;
  customType: string;
  primaryModel: OperatingModel;
  additionalModels: OperatingModel[];
  /** True after user confirms step 2 (recommendation or manual picker) */
  primaryModelConfirmed: boolean;
  primaryModelSource: PrimaryModelSelectionSource;
  /** Selected option for ambiguous presets (coach, consultant, freelance) */
  clarificationChoiceId?: string;
  categories: OnboardingCategoryDraft[];
  updatedAt: string;
}

export interface ResolveRecommendedCategoriesInput {
  businessType?: string;
  presetId?: string;
  primaryOperatingModel: OperatingModel;
  enabledOperatingModels: OperatingModel[];
}
