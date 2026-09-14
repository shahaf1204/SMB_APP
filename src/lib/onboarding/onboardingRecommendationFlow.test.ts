import { describe, expect, it } from 'vitest';
import {
  resolveBusinessTypeOperatingRecommendation,
  resolveEffectiveOperatingRecommendation,
} from '../../config/businessTypeRecommendationConfig';
import {
  isContextuallyRecommendedSupportingModel,
  resolveRecommendedSupportingModels,
  resolveSupportingModelPrompts,
  shouldUseContextualSupportingModelFlow,
} from '../../config/supportingModelPresentationConfig';
import {
  shouldShowRecommendationFirst,
} from './primaryModelDraft';
import {
  acceptRecommendedPrimaryModel,
  applyBusinessTypeChangeToDraft,
  selectManualPrimaryModel,
} from './primaryModelDraft';
import { createDefaultDraft } from './draftStorage';
import { buildCapabilityProfileFromSetup } from './businessSetup';

describe('primary recommendation ownership (step 2)', () => {
  it('Photographer fresh onboarding — step 2 shows Event as recommended primary', () => {
    const resolved = resolveBusinessTypeOperatingRecommendation('list', 'photographer');
    expect(resolved.kind).toBe('recommended');
    if (resolved.kind !== 'recommended') return;
    expect(resolved.recommendation.recommendedPrimary).toBe('event');
    expect(
      shouldShowRecommendationFirst(resolved, 'none', false, false),
    ).toBe(true);
  });

  it('Birthday fresh onboarding — step 2 shows Event as recommended primary', () => {
    const resolved = resolveBusinessTypeOperatingRecommendation('list', 'birthday');
    expect(resolved.kind).toBe('recommended');
    if (resolved.kind !== 'recommended') return;
    expect(resolved.recommendation.recommendedPrimary).toBe('event');
  });
});

describe('supporting recommendation independence (step 3)', () => {
  const photographerEventInput = {
    mode: 'list' as const,
    presetId: 'photographer',
    primaryModel: 'event' as const,
  };

  it('Photographer + Event primary — Project from contextual supporting rules only', () => {
    const supporting = resolveRecommendedSupportingModels(photographerEventInput);
    expect(supporting).toEqual(['project']);
    expect(shouldUseContextualSupportingModelFlow(photographerEventInput)).toBe(true);
    expect(resolveSupportingModelPrompts(photographerEventInput)[0]?.targetModel).toBe(
      'project',
    );
  });

  it('Photographer + Package override — Project is NOT a supporting recommendation', () => {
    const input = {
      mode: 'list' as const,
      presetId: 'photographer',
      primaryModel: 'package' as const,
    };
    expect(resolveRecommendedSupportingModels(input)).toEqual([]);
    expect(isContextuallyRecommendedSupportingModel(input, 'project')).toBe(false);
    expect(isContextuallyRecommendedSupportingModel(input, 'event')).toBe(false);
    expect(shouldUseContextualSupportingModelFlow(input)).toBe(false);
  });

  it('Photographer manual Package override preserves user choice in draft', () => {
    let draft = createDefaultDraft();
    draft = applyBusinessTypeChangeToDraft(draft, 'photographer', 'list');
    draft = selectManualPrimaryModel(draft, 'package');
    expect(draft.primaryModel).toBe('package');
    expect(draft.primaryModelSource).toBe('manual');
  });

  it('no primary recommendation leaks into additional models automatically', () => {
    const input = {
      mode: 'list' as const,
      presetId: 'photographer',
      primaryModel: 'package' as const,
    };
    const effective = resolveEffectiveOperatingRecommendation('list', 'photographer');
    expect(effective.kind).toBe('recommended');
    if (effective.kind !== 'recommended') return;
    expect(effective.recommendation.recommendedPrimary).toBe('event');
    expect(isContextuallyRecommendedSupportingModel(input, 'event')).toBe(false);
  });

  it('supporting recommendations come only from contextual config for selected primary', () => {
    const tutorInput = {
      mode: 'list' as const,
      presetId: 'tutor',
      primaryModel: 'appointment' as const,
    };
    expect(resolveRecommendedSupportingModels(tutorInput)).toEqual(['package']);
    expect(isContextuallyRecommendedSupportingModel(tutorInput, 'project')).toBe(false);
  });
});

describe('business type change + recommendation flow', () => {
  it('Photographer → Birthday recomputes recommendation-derived primary to Event', () => {
    let draft = createDefaultDraft();
    draft = applyBusinessTypeChangeToDraft(draft, 'photographer', 'list');
    draft = acceptRecommendedPrimaryModel(draft, 'event');

    draft = applyBusinessTypeChangeToDraft(draft, 'birthday', 'list');
    expect(draft.primaryModel).toBe('event');
    expect(draft.primaryModelSource).toBe('recommended');
    expect(draft.primaryModelConfirmed).toBe(true);
  });
});

describe('Phase 2B.1 consent rules remain intact', () => {
  it('hidden optional recommendation is not newly activated', () => {
    const profile = buildCapabilityProfileFromSetup({
      businessTypePresetId: 'beauty',
      primaryOperatingModel: 'appointment',
      additionalOperatingModels: [],
    });
    expect(profile).toBeUndefined();
  });
});

describe('accept recommended primary path', () => {
  it('accepting photographer recommendation sets event primary', () => {
    let draft = createDefaultDraft();
    draft = applyBusinessTypeChangeToDraft(draft, 'photographer', 'list');
    draft = acceptRecommendedPrimaryModel(draft, 'event');
    expect(draft.primaryModel).toBe('event');
    expect(draft.primaryModelSource).toBe('recommended');
  });
});
