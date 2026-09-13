import { partitionDraftsForOnboarding } from '../activityForm/resolveActivityFormSchema';
import { defaultEnabledForDraft, resolveFieldMeta } from '../activityForm/fieldMetadata';
import type { OnboardingCategoryDraft } from '../../types/onboarding';
import type { OperatingModel } from '../../types/workspace';

export interface FieldPreviewPresentationInput {
  categories: readonly OnboardingCategoryDraft[];
  businessType?: string;
  operatingModel: OperatingModel;
}

export interface FieldPreviewPresentation {
  /** Enabled recommended + optional fields beyond core preview rows */
  alsoSavingLabels: string[];
  hasCustomizationSurface: boolean;
}

/**
 * Presentation layer for field preview — reuses category draft partitioning.
 * Does not recommend fields; only summarizes already-selected drafts.
 */
export function resolveFieldPreviewPresentation(
  input: FieldPreviewPresentationInput,
): FieldPreviewPresentation {
  const partition = partitionDraftsForOnboarding([...input.categories], {
    businessType: input.businessType,
    operatingModel: input.operatingModel,
  });

  const enabledRecommended = partition.recommended
    .filter((c) => c.enabled)
    .map((c) => c.name);
  const enabledMore = partition.more.filter((c) => c.enabled).map((c) => c.name);

  const alsoSavingLabels = [...enabledRecommended, ...enabledMore];

  return {
    alsoSavingLabels,
    hasCustomizationSurface:
      partition.recommended.length > 0 ||
      partition.more.length > 0 ||
      input.categories.some((c) => c.source === 'manual'),
  };
}

/** Whether edit mode should open field customization immediately. */
export function shouldOpenFieldCustomizationOnEdit(
  categories: readonly OnboardingCategoryDraft[],
): boolean {
  if (categories.some((c) => c.source === 'manual')) return true;

  return categories.some((c) => {
    if (c.isProtected || c.source === 'manual') return false;
    const meta = resolveFieldMeta(c.key, c.name, c.metricRole, c.isProtected);
    return c.enabled !== defaultEnabledForDraft(c.key, meta);
  });
}
