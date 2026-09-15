import {
  resolveBusinessTypeOperatingRecommendation,
  resolveEffectiveOperatingRecommendation,
} from '../../config/businessTypeRecommendationConfig';
import type { PrimaryModelSelectionSource } from '../../types/onboarding';
import type { OperatingModel } from '../../types/workspace';
import {
  shouldShowClarification,
  shouldShowConfirmedPrimarySelection,
  shouldShowRecommendationFirst,
} from './primaryModelDraft';

export type PrimaryStepView =
  | 'recommendation_first'
  | 'dual_recommended_selected'
  | 'confirmed_single'
  | 'clarification'
  | 'full_picker';

export interface PrimaryStepPresentationInput {
  mode: 'list' | 'custom';
  presetId: string;
  clarificationChoiceId?: string;
  selectedPrimaryModel: OperatingModel;
  primaryModelSource: PrimaryModelSelectionSource;
  primaryModelConfirmed: boolean;
  showAlternativePicker: boolean;
}

export interface PrimaryStepPresentation {
  view: PrimaryStepView;
  recommendedPrimaryModel: OperatingModel | null;
  selectedPrimaryModel: OperatingModel;
  recommendedExplanationHe: string | null;
  isFollowingRecommendation: boolean;
  hasManualOverride: boolean;
}

export function isFollowingRecommendation(
  selectedPrimaryModel: OperatingModel,
  recommendedPrimaryModel: OperatingModel | null,
): boolean {
  return (
    recommendedPrimaryModel !== null && selectedPrimaryModel === recommendedPrimaryModel
  );
}

export function hasManualPrimaryOverride(
  primaryModelSource: PrimaryModelSelectionSource,
  selectedPrimaryModel: OperatingModel,
  recommendedPrimaryModel: OperatingModel | null,
): boolean {
  return (
    primaryModelSource === 'manual' &&
    recommendedPrimaryModel !== null &&
    selectedPrimaryModel !== recommendedPrimaryModel
  );
}

export function resolveRecommendedPrimaryModel(
  mode: 'list' | 'custom',
  presetId: string,
  clarificationChoiceId?: string,
): OperatingModel | null {
  const effective = resolveEffectiveOperatingRecommendation(
    mode,
    presetId,
    clarificationChoiceId,
  );
  if (effective.kind !== 'recommended') return null;
  return effective.recommendation.recommendedPrimary;
}

/** Pure presentation resolver — mirrors OnboardingStepPrimaryModel branching. */
export function resolvePrimaryStepPresentation(
  input: PrimaryStepPresentationInput,
): PrimaryStepPresentation {
  const resolved = resolveBusinessTypeOperatingRecommendation(input.mode, input.presetId);
  const effective = resolveEffectiveOperatingRecommendation(
    input.mode,
    input.presetId,
    input.clarificationChoiceId,
  );

  const recommendedPrimaryModel = resolveRecommendedPrimaryModel(
    input.mode,
    input.presetId,
    input.clarificationChoiceId,
  );
  const recommendedExplanationHe =
    effective.kind === 'recommended' ? effective.recommendation.explanationHe : null;

  const following = isFollowingRecommendation(
    input.selectedPrimaryModel,
    recommendedPrimaryModel,
  );
  const manualOverride = hasManualPrimaryOverride(
    input.primaryModelSource,
    input.selectedPrimaryModel,
    recommendedPrimaryModel,
  );

  const baseFields = {
    recommendedPrimaryModel,
    selectedPrimaryModel: input.selectedPrimaryModel,
    recommendedExplanationHe,
    isFollowingRecommendation: following,
    hasManualOverride: manualOverride,
  };

  const showClarification = shouldShowClarification(
    resolved,
    input.clarificationChoiceId,
    input.primaryModelSource,
    input.showAlternativePicker,
    input.primaryModelConfirmed,
  );

  if (showClarification && resolved.kind === 'clarification') {
    return {
      view: 'clarification',
      ...baseFields,
    };
  }

  const showDual = manualOverride && !input.showAlternativePicker;

  if (showDual) {
    return {
      view: 'dual_recommended_selected',
      ...baseFields,
    };
  }

  const showConfirmed = shouldShowConfirmedPrimarySelection(
    input.primaryModelConfirmed,
    input.primaryModelSource,
    input.showAlternativePicker,
  );

  if (showConfirmed) {
    return {
      view: 'confirmed_single',
      ...baseFields,
    };
  }

  const showRecommendation = shouldShowRecommendationFirst(
    effective,
    input.primaryModelSource,
    input.showAlternativePicker,
    input.primaryModelConfirmed,
  );

  if (showRecommendation && effective.kind === 'recommended') {
    return {
      view: 'recommendation_first',
      ...baseFields,
    };
  }

  return {
    view: 'full_picker',
    ...baseFields,
  };
}

/** Step 2 shows two primary cards only when recommendation and manual selection differ. */
export function shouldRenderDualPrimaryCards(
  presentation: PrimaryStepPresentation,
): boolean {
  return presentation.view === 'dual_recommended_selected' && presentation.hasManualOverride;
}

/** Primary continue action — one CTA when following recommendation, distinct override CTA when not. */
export function resolvePrimaryStepPrimaryCtaKind(
  presentation: PrimaryStepPresentation,
): 'single_continue' | 'continue_with_my_choice' | 'other' {
  if (shouldRenderDualPrimaryCards(presentation)) {
    return 'continue_with_my_choice';
  }
  if (
    presentation.view === 'recommendation_first' ||
    (presentation.view === 'confirmed_single' && presentation.isFollowingRecommendation)
  ) {
    return 'single_continue';
  }
  return 'other';
}

/** Default alternative-picker visibility for step 2 mount / business type change. */
export function defaultShowAlternativePicker(
  mode: 'list' | 'custom',
  presetId: string,
  primaryModelSource: PrimaryModelSelectionSource,
): boolean {
  const resolved = resolveBusinessTypeOperatingRecommendation(mode, presetId);
  if (resolved.kind === 'fallback') return true;
  if (primaryModelSource === 'manual') {
    return resolveRecommendedPrimaryModel(mode, presetId) === null;
  }
  return false;
}
