import type { OnboardingDraft, PrimaryModelSelectionSource } from '../../types/onboarding';
import {
  resolveBusinessTypeOperatingRecommendation,
  resolveEffectiveOperatingRecommendation,
  type BusinessTypeRecommendationResult,
} from '../../config/businessTypeRecommendationConfig';
import type { OperatingModel } from '../../types/workspace';

/** Patch applied when business type changes — respects explicit manual primary choice. */
export function applyBusinessTypeChangeToDraft(
  draft: OnboardingDraft,
  presetId: string,
  mode: OnboardingDraft['mode'],
): OnboardingDraft {
  const base: OnboardingDraft = {
    ...draft,
    presetId,
    mode: presetId === '__other__' ? 'custom' : mode,
  };

  if (draft.primaryModelSource === 'manual') {
    return base;
  }

  const resolved = resolveBusinessTypeOperatingRecommendation(base.mode, base.presetId);
  return {
    ...base,
    primaryModelSource: 'none',
    primaryModelConfirmed: false,
    clarificationChoiceId: undefined,
    primaryModel: resolvePlaceholderPrimaryModel(resolved),
    additionalModels: [],
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

export function resolveActiveRecommendation(
  mode: OnboardingDraft['mode'],
  presetId: string,
  clarificationChoiceId?: string,
): BusinessTypeRecommendationResult {
  return resolveEffectiveOperatingRecommendation(mode, presetId, clarificationChoiceId);
}
