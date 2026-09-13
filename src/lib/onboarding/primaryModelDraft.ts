import type { OnboardingDraft, PrimaryModelSelectionSource } from '../../types/onboarding';
import {
  resolveBusinessTypeOperatingRecommendation,
  resolveEffectiveOperatingRecommendation,
  WORKING_STYLE_LABELS_HE,
  type BusinessTypeOperatingRecommendation,
  type BusinessTypeRecommendationResult,
  type RecommendableOperatingModel,
} from '../../config/businessTypeRecommendationConfig';
import type { OperatingModel } from '../../types/workspace';

/** User explicitly chose an alternative primary (not recommendation-derived). */
export function isPrimaryModelUserOverride(
  source: PrimaryModelSelectionSource,
): boolean {
  return source === 'manual';
}

/** Primary was chosen from (or is awaiting) the business-type recommendation. */
export function isPrimaryModelRecommendationDerived(
  draft: Pick<OnboardingDraft, 'primaryModelSource'>,
): boolean {
  return draft.primaryModelSource !== 'manual';
}

export function resolveRecommendedPrimaryFromResult(
  resolved: BusinessTypeRecommendationResult,
): OperatingModel {
  if (resolved.kind === 'recommended') {
    return resolved.recommendation.recommendedPrimary;
  }
  return resolvePlaceholderPrimaryModel(resolved);
}

export interface PrimaryModelOverrideContext {
  mode: OnboardingDraft['mode'];
  presetId: string;
  primaryModel: OperatingModel;
  primaryModelSource: PrimaryModelSelectionSource;
  clarificationChoiceId?: string;
}

/** Whether the user's manual primary differs from the current business-type recommendation. */
export function isPrimaryModelOverrideStale(
  context: PrimaryModelOverrideContext,
): boolean {
  if (!isPrimaryModelUserOverride(context.primaryModelSource)) return false;
  const effective = resolveEffectiveOperatingRecommendation(
    context.mode,
    context.presetId,
    context.clarificationChoiceId,
  );
  if (effective.kind !== 'recommended') return false;
  return context.primaryModel !== effective.recommendation.recommendedPrimary;
}

export function primaryModelOverrideNoticeHe(
  context: PrimaryModelOverrideContext,
): string | undefined {
  if (!isPrimaryModelOverrideStale(context)) return undefined;
  const effective = resolveEffectiveOperatingRecommendation(
    context.mode,
    context.presetId,
    context.clarificationChoiceId,
  );
  if (effective.kind !== 'recommended') return undefined;
  const recommendedLabel =
    WORKING_STYLE_LABELS_HE[
      effective.recommendation.recommendedPrimary as RecommendableOperatingModel
    ];
  return `בחרת דרך עבודה שונה מההמלצה הנוכחית (${recommendedLabel}). אפשר להמשיך או לשנות.`;
}

function refreshAdditionalModelsOnTypeChange(
  draft: OnboardingDraft,
  oldRecommendation: BusinessTypeOperatingRecommendation | undefined,
  primaryRecomputed: boolean,
): OperatingModel[] {
  if (primaryRecomputed) return [];

  const oldRecommended = new Set(oldRecommendation?.recommendedAdditional ?? []);
  return draft.additionalModels.filter(
    (m) => !oldRecommended.has(m as RecommendableOperatingModel),
  );
}

function applyRecommendationDerivedPrimaryOnTypeChange(
  draft: OnboardingDraft,
  resolved: BusinessTypeRecommendationResult,
): Pick<
  OnboardingDraft,
  'primaryModel' | 'primaryModelSource' | 'primaryModelConfirmed' | 'clarificationChoiceId'
> {
  const wasRecommendationConfirmed =
    draft.primaryModelSource === 'recommended' && draft.primaryModelConfirmed;

  if (resolved.kind === 'recommended') {
    return {
      primaryModel: resolved.recommendation.recommendedPrimary,
      primaryModelSource: wasRecommendationConfirmed ? 'recommended' : 'none',
      primaryModelConfirmed: wasRecommendationConfirmed,
      clarificationChoiceId: undefined,
    };
  }

  return {
    primaryModel: resolvePlaceholderPrimaryModel(resolved),
    primaryModelSource: 'none',
    primaryModelConfirmed: false,
    clarificationChoiceId: undefined,
  };
}

const DOWNSTREAM_RESET: Pick<OnboardingDraft, 'categories' | 'setupDisabledFeatures'> = {
  categories: [],
  setupDisabledFeatures: [],
};

/**
 * Apply business identity change (preset and/or mode).
 * Preserves business name; resets stale recommendation-derived state.
 */
export function applyBusinessTypeChangeToDraft(
  draft: OnboardingDraft,
  presetId: string,
  mode: OnboardingDraft['mode'],
): OnboardingDraft {
  const oldEffective = resolveEffectiveOperatingRecommendation(
    draft.mode,
    draft.presetId,
    draft.clarificationChoiceId,
  );
  const oldRecommendation =
    oldEffective.kind === 'recommended' ? oldEffective.recommendation : undefined;

  const nextMode = presetId === '__other__' ? 'custom' : mode;
  const base: OnboardingDraft = {
    ...draft,
    presetId,
    mode: nextMode,
  };

  if (isPrimaryModelUserOverride(draft.primaryModelSource)) {
    return {
      ...base,
      clarificationChoiceId: undefined,
      additionalModels: refreshAdditionalModelsOnTypeChange(
        draft,
        oldRecommendation,
        false,
      ).filter((m) => m !== base.primaryModel),
      ...DOWNSTREAM_RESET,
    };
  }

  const resolved = resolveBusinessTypeOperatingRecommendation(nextMode, presetId);
  const primaryPatch = applyRecommendationDerivedPrimaryOnTypeChange(draft, resolved);

  return {
    ...base,
    ...primaryPatch,
    additionalModels: [],
    ...DOWNSTREAM_RESET,
  };
}

/** Placeholder primary until user confirms — not used for category recompute until confirmed. */
export function resolvePlaceholderPrimaryModel(
  resolved: BusinessTypeRecommendationResult,
): OperatingModel {
  if (resolved.kind === 'recommended') {
    return resolved.recommendation.recommendedPrimary;
  }
  return 'appointment';
}

export function applyClarificationChoiceToDraft(
  draft: OnboardingDraft,
  choiceId: string,
  primaryModel: OperatingModel,
): OnboardingDraft {
  return {
    ...draft,
    clarificationChoiceId: choiceId,
    primaryModel,
    primaryModelSource: 'none',
    primaryModelConfirmed: false,
  };
}

export function acceptRecommendedPrimaryModel(
  draft: OnboardingDraft,
  recommendedPrimary: OperatingModel,
): OnboardingDraft {
  return {
    ...draft,
    primaryModel: recommendedPrimary,
    primaryModelSource: 'recommended',
    primaryModelConfirmed: true,
    additionalModels: draft.additionalModels.filter((m) => m !== recommendedPrimary),
  };
}

export function selectManualPrimaryModel(
  draft: OnboardingDraft,
  primaryModel: OperatingModel,
): OnboardingDraft {
  const additionalModels =
    primaryModel !== 'hybrid'
      ? draft.additionalModels.filter((m) => m !== primaryModel)
      : [];
  return {
    ...draft,
    primaryModel,
    primaryModelSource: 'manual',
    primaryModelConfirmed: true,
    clarificationChoiceId: undefined,
    additionalModels,
  };
}

export function shouldShowRecommendationFirst(
  resolved: BusinessTypeRecommendationResult,
  primaryModelSource: PrimaryModelSelectionSource,
  showAlternativePicker: boolean,
  primaryModelConfirmed: boolean,
): boolean {
  if (resolved.kind === 'fallback') return false;
  if (showAlternativePicker) return false;
  if (primaryModelSource === 'manual') return false;
  if (primaryModelConfirmed) return false;
  return resolved.kind === 'recommended';
}

export function shouldShowClarification(
  resolved: BusinessTypeRecommendationResult,
  clarificationChoiceId: string | undefined,
  primaryModelSource: PrimaryModelSelectionSource,
  showAlternativePicker: boolean,
  primaryModelConfirmed: boolean,
): boolean {
  if (resolved.kind !== 'clarification') return false;
  if (showAlternativePicker) return false;
  if (primaryModelSource === 'manual') return false;
  if (primaryModelConfirmed) return false;
  return !clarificationChoiceId;
}

export function shouldShowConfirmedRecommendation(
  primaryModelConfirmed: boolean,
  primaryModelSource: PrimaryModelSelectionSource,
  showAlternativePicker: boolean,
): boolean {
  return (
    primaryModelConfirmed &&
    primaryModelSource === 'recommended' &&
    !showAlternativePicker
  );
}

/** Confirmed primary selection — recommendation or explicit user override. */
export function shouldShowConfirmedPrimarySelection(
  primaryModelConfirmed: boolean,
  primaryModelSource: PrimaryModelSelectionSource,
  showAlternativePicker: boolean,
): boolean {
  return (
    primaryModelConfirmed &&
    (primaryModelSource === 'recommended' || primaryModelSource === 'manual') &&
    !showAlternativePicker
  );
}

export function resolveActiveRecommendation(
  mode: OnboardingDraft['mode'],
  presetId: string,
  clarificationChoiceId?: string,
): BusinessTypeRecommendationResult {
  return resolveEffectiveOperatingRecommendation(mode, presetId, clarificationChoiceId);
}
