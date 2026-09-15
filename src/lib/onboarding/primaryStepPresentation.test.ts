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
  resolvePrimaryStepPresentation,
  resolveRecommendedPrimaryModel,
} from './primaryStepPresentation';

describe('Step 2 presentation — runtime wiring', () => {
  it('TEST 1: Fresh Photographer — Event recommended on step 2', () => {
    let draft = createDefaultDraft();
    draft = applyBusinessTypeChangeToDraft(draft, 'photographer', 'list');

    expect(resolveRecommendedPrimaryModel('list', 'photographer')).toBe('event');

    const presentation = resolvePrimaryStepPresentation({
      mode: draft.mode,
      presetId: draft.presetId,
      selectedPrimaryModel: draft.primaryModel,
      primaryModelSource: draft.primaryModelSource,
      primaryModelConfirmed: draft.primaryModelConfirmed,
      showAlternativePicker: defaultShowAlternativePicker(
        draft.mode,
        draft.presetId,
        draft.primaryModelSource,
      ),
    });

    expect(presentation.view).toBe('recommendation_first');
    expect(presentation.recommendedPrimaryModel).toBe('event');
  });

  it('TEST 2: Photographer manual Package — dual recommended + selected', () => {
    let draft = createDefaultDraft();
    draft = applyBusinessTypeChangeToDraft(draft, 'photographer', 'list');
    draft = selectManualPrimaryModel(draft, 'package');

    const presentation = resolvePrimaryStepPresentation({
      mode: draft.mode,
      presetId: draft.presetId,
      selectedPrimaryModel: draft.primaryModel,
      primaryModelSource: draft.primaryModelSource,
      primaryModelConfirmed: draft.primaryModelConfirmed,
      showAlternativePicker: false,
    });

    expect(presentation.view).toBe('dual_recommended_selected');
    expect(presentation.recommendedPrimaryModel).toBe('event');
    expect(presentation.selectedPrimaryModel).toBe('package');
  });

  it('TEST 3: Photographer → Birthday after manual override — new recommendation visible', () => {
    let draft = createDefaultDraft();
    draft = applyBusinessTypeChangeToDraft(draft, 'photographer', 'list');
    draft = selectManualPrimaryModel(draft, 'package');

    draft = applyBusinessTypeChangeToDraft(draft, 'birthday', 'list');

    expect(resolveRecommendedPrimaryModel('list', 'birthday')).toBe('event');
    expect(draft.primaryModel).toBe('package');
    expect(draft.primaryModelSource).toBe('manual');

    const presentation = resolvePrimaryStepPresentation({
      mode: draft.mode,
      presetId: draft.presetId,
      selectedPrimaryModel: draft.primaryModel,
      primaryModelSource: draft.primaryModelSource,
      primaryModelConfirmed: draft.primaryModelConfirmed,
      showAlternativePicker: defaultShowAlternativePicker(
        draft.mode,
        draft.presetId,
        draft.primaryModelSource,
      ),
    });

    expect(presentation.view).toBe('dual_recommended_selected');
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

    const presentation = resolvePrimaryStepPresentation({
      mode: draft.mode,
      presetId: draft.presetId,
      selectedPrimaryModel: draft.primaryModel,
      primaryModelSource: draft.primaryModelSource,
      primaryModelConfirmed: draft.primaryModelConfirmed,
      showAlternativePicker: false,
    });

    expect(presentation.recommendedPrimaryModel).toBe('appointment');
    expect(presentation.view).toBe('confirmed_single');
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
    // Same shape as saveOnboardingDraft → loadOnboardingDraft (manual + confirmed survives normalize)
    const rehydrated = JSON.parse(JSON.stringify(draft)) as typeof draft;
    expect(rehydrated.primaryModel).toBe('package');
    expect(rehydrated.primaryModelSource).toBe('manual');

    const next = applyBusinessTypeChangeToDraft(rehydrated, 'beauty', 'list');
    expect(resolveRecommendedPrimaryModel('list', next.presetId)).toBe('appointment');
    expect(next.primaryModel).toBe('package');
    expect(
      resolvePrimaryStepPresentation({
        mode: next.mode,
        presetId: next.presetId,
        selectedPrimaryModel: next.primaryModel,
        primaryModelSource: next.primaryModelSource,
        primaryModelConfirmed: next.primaryModelConfirmed,
        showAlternativePicker: defaultShowAlternativePicker(
          next.mode,
          next.presetId,
          next.primaryModelSource,
        ),
      }).view,
    ).toBe('dual_recommended_selected');
  });
});
