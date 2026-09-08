import { describe, expect, it } from 'vitest';
import { CAPABILITY_REGISTRY } from '../../config/capabilityRegistry';
import {
  getBusinessSetupFeatureLabelHe,
  resolveBusinessSetupWorkspaceSummary,
} from '../../config/businessSetupPresentationConfig';
import { resolveActivityFormSchemaFromCategories } from '../activityForm/resolveActivityFormSchema';
import {
  buildCapabilityProfileFromSetup,
  isSetupKeyVisible,
  mergeSetupIntoExistingProfile,
  resolveBusinessSetupPresentation,
  toggleSetupFeatureDisabled,
} from './businessSetup';
import { resolveEnabledCapabilityKeys, resolveIncompleteCapabilityKeys } from '../capabilities';

describe('businessSetup presentation', () => {
  it('maps effective recommendations to user-facing labels without capability keys', () => {
    const presentation = resolveBusinessSetupPresentation({
      businessTypePresetId: 'photographer',
      primaryOperatingModel: 'event',
      additionalOperatingModels: ['project'],
    });

    expect(presentation.features.length).toBeGreaterThan(0);
    for (const feature of presentation.features) {
      expect(feature.labelHe).toBe(getBusinessSetupFeatureLabelHe(feature.key));
      expect(feature.labelHe).not.toContain('.');
      expect(feature.labelHe).not.toMatch(/capability/i);
    }
    expect(presentation.features.some((f) => f.key === 'event.preparation_checklist')).toBe(false);
  });

  it('Beauty + Appointment emphasizes summary and hides optional from consent surface', () => {
    const presentation = resolveBusinessSetupPresentation({
      businessTypePresetId: 'beauty',
      primaryOperatingModel: 'appointment',
      additionalOperatingModels: [],
    });

    expect(presentation.emphasizeSummaryOnly).toBe(true);
    expect(presentation.summary.bodyHe).toContain('תורים');
    expect(presentation.confirmedKeys).toEqual([]);
    expect(presentation.managedKeys).toEqual([]);
    expect(presentation.features.every((f) => CAPABILITY_REGISTRY[f.key].readiness !== 'planned')).toBe(
      true,
    );
    expect(isSetupKeyVisible(
      {
        businessTypePresetId: 'beauty',
        primaryOperatingModel: 'appointment',
        additionalOperatingModels: [],
      },
      'appointment.reminders',
    )).toBe(false);
  });

  it('Tutor + Appointment + Package reflects package as supporting behavior', () => {
    const summary = resolveBusinessSetupWorkspaceSummary({
      businessTypePresetId: 'tutor',
      primaryOperatingModel: 'appointment',
      additionalOperatingModels: ['package'],
    });

    expect(summary.bodyHe).toContain('שיעורים');
    expect(summary.bodyHe).toContain('חבילות');

    const presentation = resolveBusinessSetupPresentation({
      businessTypePresetId: 'tutor',
      primaryOperatingModel: 'appointment',
      additionalOperatingModels: ['package'],
    });
    expect(presentation.features.some((f) => f.key.startsWith('package.'))).toBe(true);
    expect(presentation.features.every((f) => f.visible)).toBe(true);
    expect(presentation.confirmedKeys).toContain('package.session_limit');
  });

  it('Photographer + Event + Project includes project support without equal-primary copy', () => {
    const presentation = resolveBusinessSetupPresentation({
      businessTypePresetId: 'photographer',
      primaryOperatingModel: 'event',
      additionalOperatingModels: ['project'],
    });
    expect(presentation.features.some((f) => f.key.startsWith('project.'))).toBe(true);
    expect(presentation.managedKeys.length).toBeGreaterThan(1);
  });

  it('custom business uses model-aware generic copy', () => {
    const summary = resolveBusinessSetupWorkspaceSummary({
      primaryOperatingModel: 'appointment',
      additionalOperatingModels: [],
    });
    expect(summary.bodyHe).toContain('פגישות');
  });
});

describe('businessSetup consent and profile activation', () => {
  it('hidden optional recommendation is not newly activated', () => {
    const profile = buildCapabilityProfileFromSetup({
      businessTypePresetId: 'beauty',
      primaryOperatingModel: 'appointment',
      additionalOperatingModels: [],
    });

    expect(profile).toBeUndefined();
  });

  it('Beauty + Appointment does not silently enable reminders when hidden', () => {
    const profile = buildCapabilityProfileFromSetup({
      businessTypePresetId: 'beauty',
      primaryOperatingModel: 'appointment',
      additionalOperatingModels: [],
      disabledFeatureKeys: [],
    });

    expect(profile?.activation?.['appointment.reminders']).toBeUndefined();
  });

  it('visible selected optional recommendation is activated when feature list is shown', () => {
    const presentation = resolveBusinessSetupPresentation({
      businessTypePresetId: 'tutor',
      primaryOperatingModel: 'appointment',
      additionalOperatingModels: ['package'],
    });

    const optional = presentation.features.find((f) => f.removable);
    expect(optional).toBeDefined();
    expect(optional!.visible).toBe(true);
    expect(optional!.confirmed).toBe(true);

    const profile = buildCapabilityProfileFromSetup({
      businessTypePresetId: 'tutor',
      primaryOperatingModel: 'appointment',
      additionalOperatingModels: ['package'],
    });
    expect(profile?.activation[optional!.key]).toBe('enabled');
  });

  it('visible disabled optional recommendation is not activated', () => {
    const optionalKey = 'package.payment_structure';
    const disabled = toggleSetupFeatureDisabled([], optionalKey, false);
    const profile = buildCapabilityProfileFromSetup({
      businessTypePresetId: 'tutor',
      primaryOperatingModel: 'appointment',
      additionalOperatingModels: ['package'],
      disabledFeatureKeys: disabled,
    });

    expect(profile?.activation[optionalKey]).toBeUndefined();
    expect(profile?.activation['package.session_limit']).toBe('enabled');
  });

  it('essential visible capabilities are confirmed without optional toggle', () => {
    const presentation = resolveBusinessSetupPresentation({
      businessTypePresetId: 'tutor',
      primaryOperatingModel: 'appointment',
      additionalOperatingModels: ['package'],
    });

    const essential = presentation.features.filter((f) => f.essential);
    expect(essential.length).toBeGreaterThan(0);
    expect(essential.every((f) => f.visible && f.confirmed)).toBe(true);

    const profile = buildCapabilityProfileFromSetup({
      businessTypePresetId: 'tutor',
      primaryOperatingModel: 'appointment',
      additionalOperatingModels: ['package'],
    });

    expect(profile?.activation['package.session_limit']).toBe('enabled');
    expect(profile?.configurationStatus['package.session_limit']).toBe('not_required');
  });

  it('new-business profile contains only legitimate managed/confirmed capabilities', () => {
    const profile = buildCapabilityProfileFromSetup({
      businessTypePresetId: 'tutor',
      primaryOperatingModel: 'appointment',
      additionalOperatingModels: ['package'],
    });

    expect(profile?.version).toBe(2);
    expect(resolveEnabledCapabilityKeys(profile)).toEqual(
      expect.arrayContaining(['package.session_limit', 'package.expiration']),
    );
    expect(resolveIncompleteCapabilityKeys(profile!)).toEqual([]);
  });

  it('edit save preserves existing out-of-scope enabled capability', () => {
    const existing = {
      version: 2 as const,
      activation: {
        'event.payments': 'enabled' as const,
        'package.session_limit': 'enabled' as const,
      },
      configurationStatus: {
        'event.payments': 'not_required' as const,
        'package.session_limit': 'not_required' as const,
      },
    };

    const profile = buildCapabilityProfileFromSetup({
      businessTypePresetId: 'tutor',
      primaryOperatingModel: 'appointment',
      additionalOperatingModels: ['package'],
      isEditMode: true,
      existingCapabilityProfile: existing,
    });

    expect(profile?.activation['event.payments']).toBe('enabled');
    expect(profile?.configurationStatus['event.payments']).toBe('not_required');
  });

  it('edit save preserves out-of-scope configurationStatus when recommendation rules change', () => {
    const existing = {
      version: 2 as const,
      activation: {
        'package.expiration': 'enabled' as const,
        'appointment.reminders': 'enabled' as const,
      },
      configurationStatus: {
        'package.expiration': 'configured' as const,
        'appointment.reminders': 'not_required' as const,
      },
    };

    const presentation = resolveBusinessSetupPresentation({
      businessTypePresetId: 'tutor',
      primaryOperatingModel: 'appointment',
      additionalOperatingModels: ['package'],
    });

    expect(presentation.managedKeys).not.toContain('appointment.reminders');

    const profile = mergeSetupIntoExistingProfile(existing, presentation);

    expect(profile.activation['appointment.reminders']).toBe('enabled');
    expect(profile.configurationStatus['appointment.reminders']).toBe('not_required');
    expect(profile.activation['package.expiration']).toBe('enabled');
    expect(profile.configurationStatus['package.expiration']).toBe('configured');
  });

  it('changing managed setup choice does not remove out-of-scope activation', () => {
    const existing = {
      version: 2 as const,
      activation: { 'event.payments': 'enabled' as const },
      configurationStatus: { 'event.payments': 'not_required' as const },
    };

    const profile = buildCapabilityProfileFromSetup({
      businessTypePresetId: 'beauty',
      primaryOperatingModel: 'appointment',
      additionalOperatingModels: [],
      isEditMode: true,
      existingCapabilityProfile: existing,
    });

    expect(profile?.activation['event.payments']).toBe('enabled');
  });

  it('never activates planned capabilities', () => {
    const profile = buildCapabilityProfileFromSetup({
      businessTypePresetId: 'tutor',
      primaryOperatingModel: 'appointment',
      additionalOperatingModels: ['package'],
    });

    expect(profile?.activation['appointment.service_catalog']).toBeUndefined();
    expect(profile?.activation['appointment.working_hours']).toBeUndefined();
  });
});

describe('fields remain independent from business setup', () => {
  it('activity form schema is unchanged by setup layer', () => {
    const schema = resolveActivityFormSchemaFromCategories({
      operatingModel: 'appointment',
      categories: [],
    });
    expect(schema.fields.length).toBeGreaterThan(0);

    resolveBusinessSetupPresentation({
      businessTypePresetId: 'beauty',
      primaryOperatingModel: 'appointment',
      additionalOperatingModels: [],
    });
    expect(schema.fields.length).toBeGreaterThan(0);
  });
});
