import { describe, expect, it } from 'vitest';
import {
  buildRecommendationFromClarificationOption,
  BUSINESS_TYPE_RECOMMENDATION_POLICIES,
  BUSINESS_TYPE_OPERATING_RECOMMENDATIONS,
  NEW_USER_ONBOARDING_PICKER_OPTIONS,
  ONBOARDING_PRESET_RECOMMENDATION_POLICY,
  resolveBusinessTypeOperatingRecommendation,
  resolveEffectiveOperatingRecommendation,
  newUserPickerIncludesHybrid,
} from '../../config/businessTypeRecommendationConfig';
import { ONBOARDING_BUSINESS_TYPE_PRESETS } from '../../data/businessTypePresets';
import { normalizeEnabledModels } from '../workspace';
import { createDefaultDraft } from '../onboarding/draftStorage';
import {
  acceptRecommendedPrimaryModel,
  applyBusinessTypeChangeToDraft,
  applyClarificationChoiceToDraft,
  selectManualPrimaryModel,
  shouldShowConfirmedRecommendation,
  shouldShowRecommendationFirst,
} from '../onboarding/primaryModelDraft';

describe('businessTypeRecommendationConfig', () => {
  it('every onboarding preset has a valid policy entry', () => {
    expect(ONBOARDING_PRESET_RECOMMENDATION_POLICY.every((p) => p.hasPolicy)).toBe(true);
    expect(ONBOARDING_PRESET_RECOMMENDATION_POLICY).toHaveLength(
      ONBOARDING_BUSINESS_TYPE_PRESETS.length,
    );
  });

  it('clear preset still receives direct recommendation', () => {
    const result = resolveBusinessTypeOperatingRecommendation('list', 'beauty');
    expect(result.kind).toBe('recommended');
    if (result.kind === 'recommended') {
      expect(result.recommendation.recommendedPrimary).toBe('appointment');
    }
  });

  it('coach enters clarification instead of direct Journey assumption', () => {
    const result = resolveBusinessTypeOperatingRecommendation('list', 'coach');
    expect(result.kind).toBe('clarification');
    expect(result.kind === 'clarification' && result.clarification.options).toHaveLength(2);
  });

  it('coach clarification can resolve to Journey', () => {
    const resolved = resolveBusinessTypeOperatingRecommendation('list', 'coach');
    expect(resolved.kind).toBe('clarification');
    if (resolved.kind !== 'clarification') return;

    const effective = resolveEffectiveOperatingRecommendation('list', 'coach', 'ongoing_coaching');
    expect(effective.kind).toBe('recommended');
    if (effective.kind === 'recommended') {
      expect(effective.recommendation.recommendedPrimary).toBe('journey');
      expect(effective.recommendation.recommendedAdditional).toContain('appointment');
      expect(effective.recommendation.recommendedAdditional).toContain('package');
    }
  });

  it('coach clarification can resolve to Appointment', () => {
    const effective = resolveEffectiveOperatingRecommendation('list', 'coach', 'scheduled_sessions');
    expect(effective.kind).toBe('recommended');
    if (effective.kind === 'recommended') {
      expect(effective.recommendation.recommendedPrimary).toBe('appointment');
      expect(effective.recommendation.recommendedAdditional).toContain('package');
    }
  });

  it('consultant clarification resolves correctly', () => {
    const journey = resolveEffectiveOperatingRecommendation('list', 'consultant', 'ongoing_consulting');
    const project = resolveEffectiveOperatingRecommendation('list', 'consultant', 'defined_projects');
    expect(journey.kind).toBe('recommended');
    expect(project.kind).toBe('recommended');
    if (journey.kind === 'recommended') expect(journey.recommendation.recommendedPrimary).toBe('journey');
    if (project.kind === 'recommended') expect(project.recommendation.recommendedPrimary).toBe('project');
  });

  it('freelance clarification resolves correctly', () => {
    const project = resolveEffectiveOperatingRecommendation('list', 'freelance', 'defined_deliverables');
    const appointment = resolveEffectiveOperatingRecommendation('list', 'freelance', 'scheduled_services');
    expect(project.kind).toBe('recommended');
    expect(appointment.kind).toBe('recommended');
    if (project.kind === 'recommended') expect(project.recommendation.recommendedPrimary).toBe('project');
    if (appointment.kind === 'recommended') expect(appointment.recommendation.recommendedPrimary).toBe('appointment');
  });

  it('custom and __other__ types fall back without guessing', () => {
    expect(resolveBusinessTypeOperatingRecommendation('custom', 'freelance').kind).toBe('fallback');
    expect(resolveBusinessTypeOperatingRecommendation('list', '__other__').kind).toBe('fallback');
  });

  it('hybrid is absent from every new-user onboarding picker option', () => {
    expect(newUserPickerIncludesHybrid()).toBe(false);
    expect(NEW_USER_ONBOARDING_PICKER_OPTIONS.every((o) => o.id !== 'hybrid')).toBe(true);
  });

  it('never recommends hybrid in any policy', () => {
    for (const policy of Object.values(BUSINESS_TYPE_RECOMMENDATION_POLICIES)) {
      if (policy.type === 'direct') {
        expect(policy.recommendation.recommendedPrimary).not.toBe('hybrid');
        for (const additional of policy.recommendation.recommendedAdditional ?? []) {
          expect(additional).not.toBe('hybrid');
        }
      } else {
        for (const option of policy.clarification.options) {
          expect(option.recommendation.recommendedPrimary).not.toBe('hybrid');
          for (const additional of option.recommendation.recommendedAdditional ?? []) {
            expect(additional).not.toBe('hybrid');
          }
        }
      }
    }
  });

  it('legacy hybrid normalization remains intact for existing businesses', () => {
    const enabled = normalizeEnabledModels('hybrid', ['event', 'appointment']);
    expect(enabled).toContain('event');
    expect(enabled).toContain('appointment');
  });

  it('buildRecommendationFromClarificationOption returns full recommendation', () => {
    const policy = BUSINESS_TYPE_RECOMMENDATION_POLICIES.coach;
    expect(policy.type).toBe('clarification');
    if (policy.type !== 'clarification') return;
    const rec = buildRecommendationFromClarificationOption(
      policy.clarification,
      'ongoing_coaching',
    );
    expect(rec?.businessTypePresetId).toBe('coach');
    expect(rec?.recommendedPrimary).toBe('journey');
  });
});

describe('primaryModelDraft', () => {
  it('changing business type updates unconfirmed recommendation placeholder', () => {
    let draft = createDefaultDraft();
    expect(draft.primaryModelConfirmed).toBe(false);

    draft = applyBusinessTypeChangeToDraft(draft, 'beauty', 'list');
    expect(draft.primaryModel).toBe('appointment');
    expect(draft.primaryModelSource).toBe('none');
    expect(draft.clarificationChoiceId).toBeUndefined();

    draft = applyBusinessTypeChangeToDraft(draft, 'coach', 'list');
    expect(draft.primaryModel).toBe('appointment');
    expect(draft.clarificationChoiceId).toBeUndefined();
  });

  it('explicit manual primary choice is not overwritten when business type changes', () => {
    let draft = createDefaultDraft();
    draft = selectManualPrimaryModel(draft, 'event');
    draft = applyBusinessTypeChangeToDraft(draft, 'beauty', 'list');
    expect(draft.primaryModel).toBe('event');
    expect(draft.primaryModelSource).toBe('manual');
  });

  it('accepting recommendation writes correct primary model to draft', () => {
    const draft = createDefaultDraft();
    const resolved = resolveBusinessTypeOperatingRecommendation('list', 'tutor');
    expect(resolved.kind).toBe('recommended');
    if (resolved.kind !== 'recommended') return;

    const next = acceptRecommendedPrimaryModel(
      draft,
      resolved.recommendation.recommendedPrimary,
    );
    expect(next.primaryModel).toBe('appointment');
    expect(next.primaryModelSource).toBe('recommended');
    expect(next.primaryModelConfirmed).toBe(true);
  });

  it('confirmed recommendation back state remains confirmed', () => {
    let draft = createDefaultDraft();
    draft = acceptRecommendedPrimaryModel(draft, 'appointment');
    expect(
      shouldShowConfirmedRecommendation(
        draft.primaryModelConfirmed,
        draft.primaryModelSource,
        false,
      ),
    ).toBe(true);
    expect(
      shouldShowRecommendationFirst(
        resolveBusinessTypeOperatingRecommendation('list', 'beauty'),
        draft.primaryModelSource,
        false,
        draft.primaryModelConfirmed,
      ),
    ).toBe(false);
  });

  it('shouldShowRecommendationFirst exposes picker for fallback and manual paths', () => {
    const fallback = resolveBusinessTypeOperatingRecommendation('list', '__other__');
    expect(
      shouldShowRecommendationFirst(fallback, 'none', false, false),
    ).toBe(false);

    const beauty = resolveBusinessTypeOperatingRecommendation('list', 'beauty');
    expect(shouldShowRecommendationFirst(beauty, 'none', false, false)).toBe(true);
    expect(shouldShowRecommendationFirst(beauty, 'manual', false, false)).toBe(false);
    expect(shouldShowRecommendationFirst(beauty, 'none', true, false)).toBe(false);
  });

  it('recommended additional models are not auto-enabled on accept', () => {
    const draft = createDefaultDraft();
    const effective = resolveEffectiveOperatingRecommendation('list', 'beauty');
    expect(effective.kind).toBe('recommended');
    if (effective.kind !== 'recommended') return;

    const next = acceptRecommendedPrimaryModel(
      draft,
      effective.recommendation.recommendedPrimary,
    );
    expect(effective.recommendation.recommendedAdditional).toContain('package');
    expect(next.additionalModels).not.toContain('package');
  });

  it('clarification choice stores choice id without confirming', () => {
    let draft = createDefaultDraft();
    draft = applyBusinessTypeChangeToDraft(draft, 'coach', 'list');
    draft = applyClarificationChoiceToDraft(draft, 'ongoing_coaching', 'journey');
    expect(draft.clarificationChoiceId).toBe('ongoing_coaching');
    expect(draft.primaryModel).toBe('journey');
    expect(draft.primaryModelConfirmed).toBe(false);
    expect(draft.primaryModelSource).toBe('none');
  });

  it('ambiguous presets are flagged in policy metadata', () => {
    const ambiguous = ONBOARDING_PRESET_RECOMMENDATION_POLICY.filter((p) => p.isClarification);
    expect(ambiguous.map((p) => p.presetId).sort()).toEqual(['coach', 'consultant', 'freelance']);
  });

  it('direct presets remain in legacy direct recommendations map', () => {
    expect(BUSINESS_TYPE_OPERATING_RECOMMENDATIONS.beauty.recommendedPrimary).toBe('appointment');
    expect(BUSINESS_TYPE_OPERATING_RECOMMENDATIONS.coach).toBeUndefined();
  });
});
