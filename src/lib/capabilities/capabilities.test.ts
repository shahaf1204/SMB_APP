import { describe, expect, it } from 'vitest';
import {
  ADDITIONAL_MODEL_CAPABILITY_EXTENSIONS,
  BUSINESS_TYPE_PRIMARY_CAPABILITY_RECOMMENDATIONS,
  PRIMARY_MODEL_CAPABILITY_BASELINE,
} from '../../config/businessTypeCapabilityRecommendations';
import {
  assertRegistryComplete,
  CAPABILITY_REGISTRY,
  getCapabilitiesForOperatingModel,
  isHybridCapabilityModel,
} from '../../config/capabilityRegistry';
import { CAPABILITY_KEYS_BY_OPERATING_MODEL } from '../../types/businessArchitecture';
import { buildWorkspaceConfig, normalizeBusinessWorkspace } from '../workspace';
import { resolveActivityFormSchemaFromCategories } from '../activityForm/resolveActivityFormSchema';
import type { Business } from '../../types/models';
import {
  assertCapabilityProfileIsLightweight,
  canEnableCapabilityInProfile,
  canNewlyEnableCapability,
  createEmptyCapabilityProfile,
  getCapabilityConfigurationStatus,
  isCapabilityActiveForBusiness,
  isCapabilityGatingActive,
  isCapabilityUserExposable,
  normalizeCapabilityProfile,
  resolveArchitecturalRecommendedCapabilities,
  resolveCapabilityConfiguration,
  resolveCapabilityRecommendationSets,
  resolveConfigurationStatusOnEnable,
  resolveEffectiveRecommendedCapabilities,
  resolveEnabledCapabilityKeys,
  resolveIncompleteCapabilityKeys,
  resolveInitialConfigurationStatus,
  resolveModelLevelCapabilityBaseline,
  resolveRecommendedCapabilities,
} from './index';

describe('capabilityRegistry', () => {
  it('has valid model ownership for every Phase 0 key', () => {
    expect(() => assertRegistryComplete()).not.toThrow();
    for (const key of Object.keys(CAPABILITY_REGISTRY)) {
      const entry = CAPABILITY_REGISTRY[key as keyof typeof CAPABILITY_REGISTRY];
      expect(CAPABILITY_KEYS_BY_OPERATING_MODEL[entry.operatingModel]).toContain(entry.key);
    }
  });

  it('hybrid has no standalone capability set', () => {
    expect(isHybridCapabilityModel('hybrid')).toBe(true);
    expect('hybrid' in CAPABILITY_KEYS_BY_OPERATING_MODEL).toBe(false);
    expect(getCapabilitiesForOperatingModel('appointment').every((e) => e.operatingModel !== 'hybrid')).toBe(
      true,
    );
  });

  it('planned capability can exist in registry but is not user-exposable', () => {
    expect(CAPABILITY_REGISTRY['appointment.service_catalog'].readiness).toBe('planned');
    expect(CAPABILITY_REGISTRY['appointment.service_catalog'].configurationRequirement).toBe(
      'required',
    );
    expect(isCapabilityUserExposable('appointment.service_catalog')).toBe(false);
    expect(canNewlyEnableCapability('appointment.service_catalog')).toBe(false);
  });

  it('every capability has a configuration requirement', () => {
    for (const entry of Object.values(CAPABILITY_REGISTRY)) {
      expect(['none', 'optional', 'required']).toContain(entry.configurationRequirement);
    }
    expect(() => assertRegistryComplete()).not.toThrow();
  });
});

describe('effective vs architectural recommendations', () => {
  it('excludes planned capabilities from effective user-facing recommendations', () => {
    const sets = resolveCapabilityRecommendationSets({
      businessType: 'beauty',
      primaryOperatingModel: 'appointment',
    });

    expect(sets.architectural.keys).toContain('appointment.service_catalog');
    expect(sets.architectural.keys).toContain('appointment.working_hours');
    expect(sets.effective.keys).not.toContain('appointment.service_catalog');
    expect(sets.effective.keys).not.toContain('appointment.working_hours');
    expect(sets.effective.keys).toContain('appointment.reminders');
  });

  it('additional models cannot leak planned capabilities into effective recommendations', () => {
    const effective = resolveEffectiveRecommendedCapabilities({
      businessType: 'tutor',
      primaryOperatingModel: 'appointment',
      additionalOperatingModels: ['package'],
    });

    expect(effective.keys).toContain('package.session_limit');
    expect(effective.keys).toContain('package.expiration');
    expect(effective.keys).not.toContain('appointment.service_catalog');
    expect(effective.keys.every((k) => isCapabilityUserExposable(k))).toBe(true);
  });

  it('unknown/custom fallback cannot leak planned capabilities', () => {
    const architectural = resolveArchitecturalRecommendedCapabilities({
      businessType: '__custom__',
      primaryOperatingModel: 'appointment',
    });
    const effective = resolveRecommendedCapabilities({
      businessType: '__custom__',
      primaryOperatingModel: 'appointment',
    });

    expect(architectural.keys).toContain('appointment.default_duration');
    expect(effective.keys).not.toContain('appointment.default_duration');
    expect(effective.keys).toContain('appointment.reminders');
    expect(effective.keys.every((k) => isCapabilityUserExposable(k))).toBe(true);
  });

  it('Beauty + Appointment effective recommendations are honest subset', () => {
    const effective = resolveEffectiveRecommendedCapabilities({
      businessType: 'beauty',
      primaryOperatingModel: 'appointment',
    });
    expect(effective.keys).toEqual(['appointment.reminders']);
  });

  it('Tutor + Appointment + Package effective recommendations', () => {
    const effective = resolveEffectiveRecommendedCapabilities({
      businessType: 'tutor',
      primaryOperatingModel: 'appointment',
      additionalOperatingModels: ['package'],
    });
    expect(effective.keys).toEqual([
      'package.session_limit',
      'package.expiration',
      'package.payment_structure',
    ]);
  });

  it('Photographer + Event + Project effective recommendations', () => {
    const effective = resolveEffectiveRecommendedCapabilities({
      businessType: 'photographer',
      primaryOperatingModel: 'event',
      additionalOperatingModels: ['project'],
    });
    expect(effective.keys).toEqual([
      'event.time',
      'event.location',
      'event.payments',
      'project.deadline',
      'project.milestones',
      'project.payment_milestones',
    ]);
  });

  it('additional Package does not replace Appointment primary emphasis', () => {
    const sets = resolveCapabilityRecommendationSets({
      businessType: 'beauty',
      primaryOperatingModel: 'appointment',
      additionalOperatingModels: ['package'],
    });

    const primaryItems = sets.architectural.items.filter(
      (i) => i.source === 'business_type' || i.source === 'primary_baseline',
    );
    expect(primaryItems.every((i) => i.key.startsWith('appointment.'))).toBe(true);
    expect(sets.effective.keys.some((k) => k.startsWith('package.'))).toBe(true);
  });

  it('legacy hybrid unions enabled model baselines without hybrid keys', () => {
    const effective = resolveEffectiveRecommendedCapabilities({
      primaryOperatingModel: 'hybrid',
      enabledOperatingModels: ['event', 'appointment'],
    });
    expect(effective.keys.some((k) => k.startsWith('event.'))).toBe(true);
    expect(effective.keys.every((k) => isCapabilityUserExposable(k))).toBe(true);
  });
});

describe('recommended vs enabled', () => {
  it('recommendations do not equal enabled capabilities', () => {
    const profile = createEmptyCapabilityProfile();
    const config = resolveCapabilityConfiguration({
      businessType: 'beauty',
      primaryOperatingModel: 'appointment',
      capabilityProfile: profile,
    });

    expect(config.recommendedKeys.length).toBeGreaterThan(0);
    expect(config.enabledKeys).toEqual([]);
    expect(config.recommendedKeys).not.toEqual(config.enabledKeys);
  });

  it('planned capability cannot be newly enabled through profile guard', () => {
    expect(canEnableCapabilityInProfile('appointment.service_catalog')).toBe(false);
    expect(canEnableCapabilityInProfile('appointment.reminders')).toBe(true);
  });

  it('enabled and configuration status are independent', () => {
    const profile = createEmptyCapabilityProfile();
    profile.activation = {
      'journey.cadence': 'enabled',
      'package.session_limit': 'enabled',
    };
    profile.configurationStatus = {
      'journey.cadence': 'incomplete',
      'package.session_limit': 'configured',
    };

    expect(resolveEnabledCapabilityKeys(profile)).toContain('journey.cadence');
    expect(resolveEnabledCapabilityKeys(profile)).toContain('package.session_limit');
    expect(getCapabilityConfigurationStatus('journey.cadence', profile)).toBe('incomplete');
    expect(getCapabilityConfigurationStatus('package.session_limit', profile)).toBe('configured');
    expect(resolveIncompleteCapabilityKeys(profile)).toEqual(['journey.cadence']);
  });

  it('enabled + configured is valid without conflating activation', () => {
    const profile = createEmptyCapabilityProfile();
    profile.activation['project.payment_milestones'] = 'enabled';
    profile.configurationStatus['project.payment_milestones'] = 'configured';

    expect(resolveEnabledCapabilityKeys(profile)).toEqual(['project.payment_milestones']);
    expect(getCapabilityConfigurationStatus('project.payment_milestones', profile)).toBe(
      'configured',
    );
  });
});

describe('legacy compatibility', () => {
  it('no profile preserves legacy mode and active capabilities', () => {
    const workspace = buildWorkspaceConfig({
      primaryOperatingModel: 'appointment',
      enabledOperatingModels: ['appointment'],
      businessType: 'beauty',
    });

    expect(isCapabilityGatingActive(workspace)).toBe(false);
    expect(isCapabilityActiveForBusiness('appointment.service_catalog', workspace)).toBe(true);
    expect(isCapabilityActiveForBusiness('package.expiration', workspace)).toBe(true);
  });

  it('explicit profile gates inactive capabilities', () => {
    const workspace = buildWorkspaceConfig({
      primaryOperatingModel: 'appointment',
      enabledOperatingModels: ['appointment'],
    });
    workspace.capabilityProfile = createEmptyCapabilityProfile();
    workspace.capabilityProfile.activation = {
      'appointment.reminders': 'enabled',
    };

    expect(isCapabilityGatingActive(workspace)).toBe(true);
    expect(isCapabilityActiveForBusiness('appointment.reminders', workspace)).toBe(true);
    expect(isCapabilityActiveForBusiness('appointment.service_catalog', workspace)).toBe(false);
  });

  it('normalizes v1 profile shape to v2 activation + configurationStatus', () => {
    const normalized = normalizeCapabilityProfile({
      version: 1,
      enabled: {
        'appointment.reminders': 'enabled',
        'package.session_limit': 'configured',
        bad: 'nope',
      },
    });
    expect(normalized?.version).toBe(2);
    expect(normalized?.activation['appointment.reminders']).toBe('enabled');
    expect(normalized?.configurationStatus['appointment.reminders']).toBe('not_required');
    expect(normalized?.activation['package.session_limit']).toBe('enabled');
    expect(normalized?.configurationStatus['package.session_limit']).toBe('configured');
    expect(normalized?.activation).not.toHaveProperty('bad');
  });

  it('normalizeCapabilityProfile rejects invalid payloads', () => {
    expect(normalizeCapabilityProfile(undefined)).toBeUndefined();
    expect(normalizeCapabilityProfile(null)).toBeUndefined();
    expect(normalizeCapabilityProfile({ version: 3, activation: {} })).toBeUndefined();
    expect(normalizeCapabilityProfile({ version: 2 })).toBeUndefined();
  });

  it('capability profile remains lightweight', () => {
    const profile = createEmptyCapabilityProfile();
    profile.activation['event.time'] = 'enabled';
    profile.configurationStatus['event.time'] = 'not_required';
    expect(assertCapabilityProfileIsLightweight(profile)).toBe(true);
  });
});

describe('configuration requirement', () => {
  it('event.location resolves to not_required', () => {
    expect(resolveInitialConfigurationStatus('event.location')).toBe('not_required');
    expect(resolveConfigurationStatusOnEnable('event.location')).toBe('not_required');
  });

  it('project.deadline resolves to not_required', () => {
    expect(resolveInitialConfigurationStatus('project.deadline')).toBe('not_required');
  });

  it('required capability resolves to incomplete when newly enabled', () => {
    expect(resolveInitialConfigurationStatus('appointment.working_hours')).toBe('incomplete');
    expect(resolveConfigurationStatusOnEnable('journey.cadence')).toBe('incomplete');
  });

  it('optional capability does not automatically become incomplete', () => {
    expect(resolveInitialConfigurationStatus('appointment.reminders')).toBe('not_required');
    expect(resolveInitialConfigurationStatus('package.payment_structure')).toBe('not_required');
  });

  it('none capability does not automatically become incomplete', () => {
    expect(resolveInitialConfigurationStatus('event.time')).toBe('not_required');
    expect(resolveInitialConfigurationStatus('package.session_limit')).toBe('not_required');
    expect(resolveInitialConfigurationStatus('project.milestones')).toBe('not_required');
  });

  it('v2 normalization applies requirement-aware defaults for enabled keys', () => {
    const normalized = normalizeCapabilityProfile({
      version: 2,
      activation: {
        'event.location': 'enabled',
        'appointment.working_hours': 'enabled',
      },
      configurationStatus: {},
    });
    expect(normalized?.configurationStatus['event.location']).toBe('not_required');
    expect(normalized?.configurationStatus['appointment.working_hours']).toBe('incomplete');
  });

  it('readiness filtering remains unchanged with configuration requirements present', () => {
    const sets = resolveCapabilityRecommendationSets({
      businessType: 'beauty',
      primaryOperatingModel: 'appointment',
    });
    expect(sets.architectural.keys).toContain('appointment.working_hours');
    expect(sets.effective.keys).not.toContain('appointment.working_hours');
    expect(sets.effective.keys).toContain('appointment.reminders');
  });
});

describe('workspace normalization', () => {
  it('preserves and normalizes capabilityProfile during normalizeBusinessWorkspace', () => {
    const business: Business = {
      id: 'b1',
      name: 'Test',
      userId: 'u1',
      workspace: {
        businessType: 'beauty',
        primaryOperatingModel: 'appointment',
        enabledOperatingModels: ['appointment', 'package'],
        onboardingCompleted: true,
        capabilityProfile: {
          version: 1,
          enabled: { 'appointment.reminders': 'configured' },
        },
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    };

    const normalized = normalizeBusinessWorkspace(business);
    expect(normalized?.workspace?.capabilityProfile?.version).toBe(2);
    expect(normalized?.workspace?.capabilityProfile?.activation['appointment.reminders']).toBe(
      'enabled',
    );
    expect(
      normalized?.workspace?.capabilityProfile?.configurationStatus['appointment.reminders'],
    ).toBe('configured');
  });
});

describe('fields remain independent from capabilities', () => {
  it('activity form schema resolution is unchanged by capability layer', () => {
    const schema = resolveActivityFormSchemaFromCategories({
      operatingModel: 'appointment',
      categories: [],
    });
    expect(schema.fields.length).toBeGreaterThan(0);
    expect(schema.fields.some((f) => f.key === 'date' || f.builtin === 'date')).toBe(true);

    const config = resolveCapabilityConfiguration({
      businessType: 'beauty',
      primaryOperatingModel: 'appointment',
    });
    expect(config.recommendedKeys).toContain('appointment.reminders');
    expect(schema.fields.some((f) => f.key === 'date' || f.builtin === 'date')).toBe(true);
  });
});

describe('business type recommendation config coverage', () => {
  it('every business type override references valid capability keys', () => {
    for (const [, byModel] of Object.entries(BUSINESS_TYPE_PRIMARY_CAPABILITY_RECOMMENDATIONS)) {
      for (const keys of Object.values(byModel)) {
        for (const key of keys ?? []) {
          expect(CAPABILITY_REGISTRY[key]).toBeDefined();
        }
      }
    }
  });

  it('additional model extensions reference valid keys owned by that model', () => {
    for (const [model, keys] of Object.entries(ADDITIONAL_MODEL_CAPABILITY_EXTENSIONS)) {
      for (const key of keys) {
        expect(CAPABILITY_REGISTRY[key].operatingModel).toBe(model);
      }
    }
  });

  it('primary baselines reference valid keys', () => {
    for (const [model, keys] of Object.entries(PRIMARY_MODEL_CAPABILITY_BASELINE)) {
      for (const key of keys) {
        expect(CAPABILITY_REGISTRY[key].operatingModel).toBe(model);
      }
    }
  });

  it('unknown project fallback effective keys are exposable only', () => {
    const effective = resolveRecommendedCapabilities({
      businessType: '__custom__',
      primaryOperatingModel: 'project',
    });
    const baseline = [...resolveModelLevelCapabilityBaseline('project')];
    expect(baseline).toContain('project.deadline');
    expect(effective.keys).toContain('project.deadline');
    expect(effective.keys).toContain('project.milestones');
    expect(effective.keys).toContain('project.payment_milestones');
  });
});
