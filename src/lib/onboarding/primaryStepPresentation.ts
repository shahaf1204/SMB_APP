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
      recommendedPrimaryModel,
      selectedPrimaryModel: input.selectedPrimaryModel,
      recommendedExplanationHe,
    };
  }

  const showDual =
    recommendedPrimaryModel !== null &&
    input.primaryModelSource === 'manual' &&
    !input.showAlternativePicker;

  if (showDual) {
    return {
      view: 'dual_recommended_selected',
      recommendedPrimaryModel,
      selectedPrimaryModel: input.selectedPrimaryModel,
      recommendedExplanationHe,
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
      recommendedPrimaryModel,
      selectedPrimaryModel: input.selectedPrimaryModel,
      recommendedExplanationHe,
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
      recommendedPrimaryModel,
      selectedPrimaryModel: input.selectedPrimaryModel,
      recommendedExplanationHe,
    };
  }

  return {
    view: 'full_picker',
    recommendedPrimaryModel,
    selectedPrimaryModel: input.selectedPrimaryModel,
    recommendedExplanationHe,
  };
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
