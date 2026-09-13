import { describe, expect, it } from 'vitest';
import { resolveSupportingModelPrompts } from '../../config/supportingModelPresentationConfig';
import {
  applyDefaultEnabledToDrafts,
} from '../activityForm/resolveActivityFormSchema';
import {
  resolveRecommendedCategories,
  templatesToOnboardingDrafts,
} from '../categories/resolveRecommendedCategories';
import { resolveFieldPreviewPresentation } from './fieldPreviewPresentation';
import { buildCapabilityProfileFromSetup } from './businessSetup';
import { createDefaultDraft } from './draftStorage';
import {
  acceptRecommendedPrimaryModel,
  applyBusinessTypeChangeToDraft,
  applyClarificationChoiceToDraft,
  isPrimaryModelOverrideStale,
  isPrimaryModelUserOverride,
  primaryModelOverrideNoticeHe,
  selectManualPrimaryModel,
} from './primaryModelDraft';

describe('business type change — primary model recommendation state', () => {
  it('Photographer → Birthday recomputes recommendation-derived primary to Event', () => {
    let draft = createDefaultDraft();
    draft = applyBusinessTypeChangeToDraft(draft, 'photographer', 'list');
    draft = acceptRecommendedPrimaryModel(draft, 'event');
    expect(draft.primaryModel).toBe('event');
    expect(draft.primaryModelSource).toBe('recommended');

    draft = applyBusinessTypeChangeToDraft(draft, 'birthday', 'list');
    expect(draft.primaryModel).toBe('event');
    expect(draft.primaryModelSource).toBe('recommended');
    expect(draft.primaryModelConfirmed).toBe(true);
  });

  it('recommendation-derived Package primary does not remain stale after business type change', () => {
    let draft = createDefaultDraft();
    draft = applyBusinessTypeChangeToDraft(draft, 'tutor', 'list');
    draft = acceptRecommendedPrimaryModel(draft, 'appointment');
    draft = { ...draft, additionalModels: ['package'] };

    draft = applyBusinessTypeChangeToDraft(draft, 'photographer', 'list');
    expect(draft.primaryModel).toBe('event');
    expect(draft.primaryModelSource).toBe('recommended');
    expect(draft.additionalModels).toEqual([]);
  });

  it('user_override primary is preserved after business type change', () => {
    let draft = createDefaultDraft();
    draft = applyBusinessTypeChangeToDraft(draft, 'photographer', 'list');
    draft = selectManualPrimaryModel(draft, 'package');

    draft = applyBusinessTypeChangeToDraft(draft, 'birthday', 'list');
    expect(draft.primaryModel).toBe('package');
    expect(draft.primaryModelSource).toBe('manual');
    expect(isPrimaryModelUserOverride(draft.primaryModelSource)).toBe(true);
  });

  it('UI can distinguish preserved override from current recommendation', () => {
    const context = {
      mode: 'list' as const,
      presetId: 'birthday',
      primaryModel: 'package' as const,
      primaryModelSource: 'manual' as const,
    };
    expect(isPrimaryModelOverrideStale(context)).toBe(true);
    expect(primaryModelOverrideNoticeHe(context)).toContain('ההמלצה הנוכחית');
    expect(primaryModelOverrideNoticeHe(context)).toContain('אירועים');
  });

  it('clarification answer resets when switching to unrelated business type', () => {
    let draft = createDefaultDraft();
    draft = applyBusinessTypeChangeToDraft(draft, 'coach', 'list');
    draft = applyClarificationChoiceToDraft(draft, 'ongoing_coaching', 'journey');
    expect(draft.clarificationChoiceId).toBe('ongoing_coaching');

    draft = applyBusinessTypeChangeToDraft(draft, 'photographer', 'list');
    expect(draft.clarificationChoiceId).toBeUndefined();
    expect(draft.primaryModel).toBe('event');
  });

  it('business name is preserved on business type change', () => {
    let draft = createDefaultDraft();
    draft = { ...draft, name: 'סטודיו רותם' };
    draft = acceptRecommendedPrimaryModel(
      applyBusinessTypeChangeToDraft(draft, 'photographer', 'list'),
      'event',
    );

    draft = applyBusinessTypeChangeToDraft(draft, 'birthday', 'list');
    expect(draft.name).toBe('סטודיו רותם');
  });
});

describe('business type change — additional models and downstream state', () => {
  it('stale recommendation-derived additional model is removed on type change', () => {
    let draft = createDefaultDraft();
    draft = applyBusinessTypeChangeToDraft(draft, 'tutor', 'list');
    draft = acceptRecommendedPrimaryModel(draft, 'appointment');
    draft = { ...draft, additionalModels: ['package'] };

    draft = applyBusinessTypeChangeToDraft(draft, 'birthday', 'list');
    expect(draft.additionalModels).not.toContain('package');
  });

  it('explicit user-added additional model is preserved on manual override type change', () => {
    let draft = createDefaultDraft();
    draft = applyBusinessTypeChangeToDraft(draft, 'photographer', 'list');
    draft = selectManualPrimaryModel(draft, 'event');
    draft = { ...draft, additionalModels: ['journey'] };

    draft = applyBusinessTypeChangeToDraft(draft, 'birthday', 'list');
    expect(draft.primaryModel).toBe('event');
    expect(draft.additionalModels).toContain('journey');
    expect(draft.additionalModels).not.toContain('project');
  });

  it('contextual supporting-model recommendation refreshes for new business type', () => {
    const tutorPrompts = resolveSupportingModelPrompts({
      mode: 'list',
      presetId: 'tutor',
      primaryModel: 'appointment',
    });
    const birthdayPrompts = resolveSupportingModelPrompts({
      mode: 'list',
      presetId: 'birthday',
      primaryModel: 'event',
    });
    expect(tutorPrompts[0]?.targetModel).toBe('package');
    expect(birthdayPrompts).toEqual([]);
  });

  it('field preview and setup state refresh after business type change', () => {
    let draft = createDefaultDraft();
    draft = applyBusinessTypeChangeToDraft(draft, 'photographer', 'list');
    draft = acceptRecommendedPrimaryModel(draft, 'event');
    draft = {
      ...draft,
      setupDisabledFeatures: ['event.payments'],
      categories: [{ key: 'photo_type', name: 'סוג צילום', enabled: true } as never],
    };

    draft = applyBusinessTypeChangeToDraft(draft, 'birthday', 'list');
    expect(draft.setupDisabledFeatures).toEqual([]);
    expect(draft.categories).toEqual([]);

    const templates = resolveRecommendedCategories({
      presetId: 'birthday',
      primaryOperatingModel: draft.primaryModel,
      enabledOperatingModels: [draft.primaryModel],
    });
    const categories = applyDefaultEnabledToDrafts(templatesToOnboardingDrafts(templates));
    const preview = resolveFieldPreviewPresentation({
      categories,
      businessType: 'birthday',
      operatingModel: 'event',
    });
    expect(preview.alsoSavingLabels.some((l) => l.includes('מקדמה') || l.includes('יתרה'))).toBe(
      true,
    );
  });
});

describe('Phase 2B.1 consent rules remain intact', () => {
  it('hidden optional recommendation is not newly activated after identity refresh', () => {
    let draft = createDefaultDraft();
    draft = applyBusinessTypeChangeToDraft(draft, 'beauty', 'list');
    draft = acceptRecommendedPrimaryModel(draft, 'appointment');

    draft = applyBusinessTypeChangeToDraft(draft, 'beauty', 'list');
    const profile = buildCapabilityProfileFromSetup({
      businessTypePresetId: 'beauty',
      primaryOperatingModel: draft.primaryModel,
      additionalOperatingModels: draft.additionalModels,
    });
    expect(profile).toBeUndefined();
  });
});
