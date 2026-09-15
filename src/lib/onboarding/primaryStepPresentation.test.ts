import { describe, expect, it } from 'vitest';
import { ONBOARDING_BUSINESS_TYPE_PRESETS } from '../../data/businessTypePresets';
import { presetIdFromLabel } from '../../data/businessTypePresets';
import {
  applyBusinessTypeChangeToDraft,
  acceptRecommendedPrimaryModel,
  selectManualPrimaryModel,
} from './primaryModelDraft';
import { createDefaultDraft } from './draftStorage';
import {
  defaultShowAlternativePicker,
  hasManualPrimaryOverride,
  isFollowingRecommendation,
  resolvePrimaryStepPresentation,
  resolvePrimaryStepPrimaryCtaKind,
  resolveRecommendedPrimaryModel,
  shouldRenderDualPrimaryCards,
} from './primaryStepPresentation';

function presentationForDraft(
  draft: ReturnType<typeof createDefaultDraft>,
  showAlternativePicker?: boolean,
) {
  return resolvePrimaryStepPresentation({
    mode: draft.mode,
    presetId: draft.presetId,
    selectedPrimaryModel: draft.primaryModel,
    primaryModelSource: draft.primaryModelSource,
    primaryModelConfirmed: draft.primaryModelConfirmed,
    showAlternativePicker:
      showAlternativePicker ??
      defaultShowAlternativePicker(draft.mode, draft.presetId, draft.primaryModelSource),
  });
}

describe('Step 2 presentation — runtime wiring', () => {
  it('TEST 1: Fresh Photographer — Event recommended on step 2', () => {
    let draft = createDefaultDraft();
    draft = applyBusinessTypeChangeToDraft(draft, 'photographer', 'list');

    expect(resolveRecommendedPrimaryModel('list', 'photographer')).toBe('event');

    const presentation = presentationForDraft(draft);

    expect(presentation.view).toBe('recommendation_first');
    expect(presentation.recommendedPrimaryModel).toBe('event');
    expect(shouldRenderDualPrimaryCards(presentation)).toBe(false);
    expect(resolvePrimaryStepPrimaryCtaKind(presentation)).toBe('single_continue');
  });

  it('TEST 2: Photographer manual Package — dual recommended + selected', () => {
    let draft = createDefaultDraft();
    draft = applyBusinessTypeChangeToDraft(draft, 'photographer', 'list');
    draft = selectManualPrimaryModel(draft, 'package');

    const presentation = presentationForDraft(draft, false);

    expect(presentation.view).toBe('dual_recommended_selected');
    expect(presentation.hasManualOverride).toBe(true);
    expect(presentation.recommendedPrimaryModel).toBe('event');
    expect(presentation.selectedPrimaryModel).toBe('package');
    expect(shouldRenderDualPrimaryCards(presentation)).toBe(true);
    expect(resolvePrimaryStepPrimaryCtaKind(presentation)).toBe('continue_with_my_choice');
  });

  it('Birthday + Event recommended + Event selected — one card state only', () => {
    let draft = createDefaultDraft();
    draft = applyBusinessTypeChangeToDraft(draft, 'birthday', 'list');
    draft = selectManualPrimaryModel(draft, 'event');

    const presentation = presentationForDraft(draft);

    expect(presentation.recommendedPrimaryModel).toBe('event');
    expect(presentation.selectedPrimaryModel).toBe('event');
    expect(isFollowingRecommendation(draft.primaryModel, 'event')).toBe(true);
    expect(hasManualPrimaryOverride(draft.primaryModelSource, draft.primaryModel, 'event')).toBe(
      false,
    );
    expect(presentation.view).toBe('confirmed_single');
    expect(shouldRenderDualPrimaryCards(presentation)).toBe(false);
    expect(presentation.isFollowingRecommendation).toBe(true);
    expect(presentation.hasManualOverride).toBe(false);
  });

  it('Matching recommendation — single continue CTA, no override dual view', () => {
    let draft = createDefaultDraft();
    draft = applyBusinessTypeChangeToDraft(draft, 'birthday', 'list');
    draft = acceptRecommendedPrimaryModel(draft, 'event');

    const presentation = presentationForDraft(draft, false);

    expect(presentation.isFollowingRecommendation).toBe(true);
    expect(shouldRenderDualPrimaryCards(presentation)).toBe(false);
    expect(resolvePrimaryStepPrimaryCtaKind(presentation)).toBe('single_continue');
  });

  it('TEST 3: Photographer → Birthday after manual override — new recommendation visible', () => {
    let draft = createDefaultDraft();
    draft = applyBusinessTypeChangeToDraft(draft, 'photographer', 'list');
    draft = selectManualPrimaryModel(draft, 'package');

    draft = applyBusinessTypeChangeToDraft(draft, 'birthday', 'list');

    expect(resolveRecommendedPrimaryModel('list', 'birthday')).toBe('event');
    expect(draft.primaryModel).toBe('package');
    expect(draft.primaryModelSource).toBe('manual');

    const presentation = presentationForDraft(draft);

    expect(presentation.view).toBe('dual_recommended_selected');
    expect(presentation.hasManualOverride).toBe(true);
    expect(presentation.recommendedPrimaryModel).toBe('event');
    expect(presentation.selectedPrimaryModel).toBe('package');
  });

  it('TEST 4: Photographer → Beauty — Beauty recommendation visible', () => {
    let draft = createDefaultDraft();
    draft = applyBusinessTypeChangeToDraft(draft, 'photographer', 'list');
    draft = acceptRecommendedPrimaryModel(draft, 'event');

    draft = applyBusinessTypeChangeToDraft(draft, 'beauty', 'list');

    expect(draft.primaryModel).toBe('appointment');
    expect(draft.primaryModelSource).toBe('recommended');

    const presentation = presentationForDraft(draft, false);

    expect(presentation.recommendedPrimaryModel).toBe('appointment');
    expect(presentation.view).toBe('confirmed_single');
    expect(presentation.isFollowingRecommendation).toBe(true);
  });

  it('Switching back to recommendation — returns to one-card following state', () => {
    let draft = createDefaultDraft();
    draft = applyBusinessTypeChangeToDraft(draft, 'photographer', 'list');
    draft = selectManualPrimaryModel(draft, 'package');
    draft = acceptRecommendedPrimaryModel(draft, 'event');

    const presentation = presentationForDraft(draft, false);

    expect(presentation.view).toBe('confirmed_single');
    expect(presentation.isFollowingRecommendation).toBe(true);
    expect(presentation.hasManualOverride).toBe(false);
    expect(shouldRenderDualPrimaryCards(presentation)).toBe(false);
    expect(resolvePrimaryStepPrimaryCtaKind(presentation)).toBe('single_continue');
  });

  it('TEST 5: Hebrew dropdown labels resolve to expected preset IDs', () => {
    const photographer = ONBOARDING_BUSINESS_TYPE_PRESETS.find((p) => p.id === 'photographer');
    const birthday = ONBOARDING_BUSINESS_TYPE_PRESETS.find((p) => p.id === 'birthday');
    const beauty = ONBOARDING_BUSINESS_TYPE_PRESETS.find((p) => p.id === 'beauty');
    const tutor = ONBOARDING_BUSINESS_TYPE_PRESETS.find((p) => p.id === 'tutor');

    expect(photographer?.label).toBe('צלם/ת');
    expect(presetIdFromLabel('צלם/ת')).toBe('photographer');
    expect(presetIdFromLabel(birthday!.label)).toBe('birthday');
    expect(presetIdFromLabel(beauty!.label)).toBe('beauty');
    expect(presetIdFromLabel(tutor!.label)).toBe('tutor');
    expect(resolveRecommendedPrimaryModel('list', 'photographer')).toBe('event');
    expect(resolveRecommendedPrimaryModel('list', 'birthday')).toBe('event');
    expect(resolveRecommendedPrimaryModel('list', 'beauty')).toBe('appointment');
  });

  it('TEST 6: Rehydrated draft + Business Type change recomputes recommendation', () => {
    let draft = createDefaultDraft();
    draft = applyBusinessTypeChangeToDraft(draft, 'photographer', 'list');
    draft = selectManualPrimaryModel(draft, 'package');
    const rehydrated = JSON.parse(JSON.stringify(draft)) as typeof draft;
    expect(rehydrated.primaryModel).toBe('package');
    expect(rehydrated.primaryModelSource).toBe('manual');

    const next = applyBusinessTypeChangeToDraft(rehydrated, 'beauty', 'list');
    expect(resolveRecommendedPrimaryModel('list', next.presetId)).toBe('appointment');
    expect(next.primaryModel).toBe('package');

    const presentation = presentationForDraft(next);
    expect(presentation.view).toBe('dual_recommended_selected');
    expect(presentation.hasManualOverride).toBe(true);
  });
});
