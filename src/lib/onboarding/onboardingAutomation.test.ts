import { describe, expect, it } from 'vitest';
import {
  resolveSupportingModelPrompts,
  shouldUseContextualSupportingModelFlow,
} from '../../config/supportingModelPresentationConfig';
import {
  AUTOMATION_SETUP_HEADLINE_HE,
  resolvePreparedWorkspaceHighlights,
} from '../../config/businessSetupPresentationConfig';
import { resolveOnboardingReviewContent } from '../../config/onboardingReviewContent';
import {
  isFieldCustomizationModeVisible,
} from '../../components/onboarding/OnboardingStepCategories';
import {
  isFullSupportingModelPickerVisible,
} from '../../components/onboarding/OnboardingStepAdditionalModels';
import {
  applyDefaultEnabledToDrafts,
} from '../activityForm/resolveActivityFormSchema';
import {
  resolveRecommendedCategories,
  templatesToOnboardingDrafts,
} from '../categories/resolveRecommendedCategories';
import {
  resolveFieldPreviewPresentation,
  shouldOpenFieldCustomizationOnEdit,
} from './fieldPreviewPresentation';
import {
  buildCapabilityProfileFromSetup,
  resolveBusinessSetupPresentation,
} from './businessSetup';

describe('supporting model contextual flow', () => {
  it('Tutor + Appointment offers Package contextually', () => {
    const prompts = resolveSupportingModelPrompts({
      mode: 'list',
      presetId: 'tutor',
      primaryModel: 'appointment',
    });
    expect(prompts).toHaveLength(1);
    expect(prompts[0].targetModel).toBe('package');
    expect(prompts[0].questionHe).toContain('חבילות');
  });

  it('Photographer + Event offers Project contextually', () => {
    const prompts = resolveSupportingModelPrompts({
      mode: 'list',
      presetId: 'photographer',
      primaryModel: 'event',
    });
    expect(prompts).toHaveLength(1);
    expect(prompts[0].targetModel).toBe('project');
  });

  it('Photographer + Package override does not recommend Project on step 3', () => {
    expect(
      resolveSupportingModelPrompts({
        mode: 'list',
        presetId: 'photographer',
        primaryModel: 'package',
      }),
    ).toEqual([]);
  });

  it('unrelated supporting model is not suggested for birthday + event', () => {
    const prompts = resolveSupportingModelPrompts({
      mode: 'list',
      presetId: 'birthday',
      primaryModel: 'event',
    });
    expect(prompts).toEqual([]);
    expect(
      shouldUseContextualSupportingModelFlow({
        mode: 'list',
        presetId: 'birthday',
        primaryModel: 'event',
      }),
    ).toBe(false);
  });

  it('full picker helper reflects disclosure state', () => {
    expect(isFullSupportingModelPickerVisible(false)).toBe(false);
    expect(isFullSupportingModelPickerVisible(true)).toBe(true);
  });

  it('custom business has no contextual prompts', () => {
    expect(
      resolveSupportingModelPrompts({
        mode: 'custom',
        presetId: '__other__',
        primaryModel: 'appointment',
      }),
    ).toEqual([]);
  });
});

describe('field preview automation', () => {
  it('recommended fields are selected by default for new business', () => {
    const templates = resolveRecommendedCategories({
      presetId: 'birthday',
      primaryOperatingModel: 'event',
      enabledOperatingModels: ['event'],
    });
    const drafts = applyDefaultEnabledToDrafts(templatesToOnboardingDrafts(templates));
    const enabledRecommended = drafts.filter(
      (d) => d.enabled && !d.isProtected && d.source !== 'manual',
    );
    expect(enabledRecommended.length).toBeGreaterThan(0);
    expect(drafts.find((d) => d.key === 'total_amount')?.enabled).toBe(true);
  });

  it('default field experience is preview-first (customization hidden by default)', () => {
    expect(isFieldCustomizationModeVisible(false)).toBe(false);
  });

  it('detailed field controls require explicit customization mode', () => {
    expect(isFieldCustomizationModeVisible(true)).toBe(true);
  });

  it('field preview summarizes also-saving labels', () => {
    const templates = resolveRecommendedCategories({
      presetId: 'birthday',
      primaryOperatingModel: 'event',
      enabledOperatingModels: ['event'],
    });
    const drafts = templatesToOnboardingDrafts(templates);
    const presentation = resolveFieldPreviewPresentation({
      categories: drafts,
      businessType: 'birthday',
      operatingModel: 'event',
    });
    expect(presentation.alsoSavingLabels.length).toBeGreaterThan(0);
    expect(presentation.hasCustomizationSurface).toBe(true);
  });

  it('edit mode opens customization when user changed selections', () => {
    const templates = resolveRecommendedCategories({
      presetId: 'birthday',
      primaryOperatingModel: 'event',
      enabledOperatingModels: ['event'],
    });
    const drafts = applyDefaultEnabledToDrafts(templatesToOnboardingDrafts(templates));
    const modified = drafts.map((d) =>
      d.key === 'deposit' ? { ...d, enabled: false } : d,
    );
    expect(shouldOpenFieldCustomizationOnEdit(modified)).toBe(true);
    expect(shouldOpenFieldCustomizationOnEdit(drafts)).toBe(false);
  });
});

describe('business setup automation copy', () => {
  it('uses prepared workspace headline', () => {
    expect(AUTOMATION_SETUP_HEADLINE_HE).toContain('הכנו לך');
    const highlights = resolvePreparedWorkspaceHighlights({
      businessTypePresetId: 'birthday',
      primaryOperatingModel: 'event',
      additionalOperatingModels: [],
    });
    expect(highlights.some((h) => h.includes('אירוע'))).toBe(true);
  });

  it('Beauty + Appointment remains summary-only without planned capabilities', () => {
    const presentation = resolveBusinessSetupPresentation({
      businessTypePresetId: 'beauty',
      primaryOperatingModel: 'appointment',
      additionalOperatingModels: [],
    });
    expect(presentation.emphasizeSummaryOnly).toBe(true);
    expect(presentation.confirmedKeys).toEqual([]);
  });
});

describe('final review automation', () => {
  it('final review does not expose technical category count', () => {
    const content = resolveOnboardingReviewContent('event');
    expect(content.readyTitleHe).toContain('מוכן');
    expect(content.valueBulletsHe.length).toBeGreaterThan(0);
    expect(JSON.stringify(content)).not.toContain('קטגוריות');
  });

  it('final CTA is model-aware', () => {
    expect(resolveOnboardingReviewContent('event').primaryActionLabelHe).toContain('אירוע');
    expect(resolveOnboardingReviewContent('appointment').primaryActionLabelHe).toContain('פגישה');
    expect(resolveOnboardingReviewContent('project').primaryActionLabelHe).toContain('פרויקט');
    expect(resolveOnboardingReviewContent('package').primaryActionLabelHe).toContain('חבילה');
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
